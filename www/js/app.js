/*
This is the generic part of a SPA Cordova app.
Please, don't add any application specific code. 
If necessary include any application specific code in local.js;
localPreprocess and localPostprocess if defined are call from app.js
immediately before and after the AJAX call for any new (sub-)page
*/
// var app = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1;
var app = navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|IEMobile)/);
var buttonEvent = "touchend";
var inputEvent = "touchstart";
var myLocation = false;
if (app) {
	document.addEventListener("deviceready", onDeviceReady, false);
	var lastStatus = "";
} else {
	buttonEvent = "click";
	inputEvent = "click";
	onDeviceReady();
}

function onDeviceReady() {
	if (app) {
		document.addEventListener("offline", disableForm, false);
		document.addEventListener("online", enableForm, false);
	}
	myCallback();
}

function myCallback() {
	var myButton = $(this);
	if (myButton.context) {
		myButton.prop("disabled",true);
	}
	// extract the form (if any) containing the button served by this callback
	var myForm = this.form;
	var params = value = '';
	var required = {};
	// if (this.className && this.className.match(/(?:^|\s)noForm(?!\S)/)) {
	if (this.classList && this.classList.contains('noForm')) {
		params = this.name+'='+this.value; 
	}
	// extract all input in the current form
	else if (typeof(myForm) !== "undefined") for (i=0; i<myForm.length; i++) {
		if (myForm.elements[i].type=='radio') {
			if (myForm.elements[i].checked) value = myForm.elements[i].value;
			if (myForm.elements[i].required) {
				if (typeof(required[myForm.elements[i].name]) === "undefined") required[myForm.elements[i].name] = {'missing': true, 'name': myForm.elements[i].name};
				if (!myForm.elements[i].checked) continue;
				required[myForm.elements[i].name].missing = false;
			}
		}
		else {
			value = myForm.elements[i].type=='checkbox'? myForm.elements[i].checked: myForm.elements[i].value;
			// memorize persistent data in localStorage
			if (myForm.elements[i].id=='rememberme') {
				localStorage['rememberme'] = value;
				if (value) {
					var tobestored = document.getElementsByClassName("localStorage");
					for (var j=0; j< tobestored.length; j++) {
						localStorage[tobestored[j].name] = tobestored[j].value;
					}
				}
			}
			// notify if a required input is missing
			if (myForm.elements[i].required && (value=='')) {
				myForm.elements[i].parentNode.style.color = "Red";
				var siblings = myForm.elements[i].parentNode.childNodes;
				for (j=0; j<siblings.length; j++) if (siblings[j].tagName=='LABEL') {
					$(siblings[j]).popover('show');
				}
				$(window).scrollTop();
				$(this).prop("disabled",false);
				myForm.elements[i].focus();
				$(window).scrollTop();
				return;
			}
		}
		params += (params==''? '': '&') + myForm.elements[i].name + '=' + value;
	}
	// notify if a required radio input is missing
	for (i in required) {
		if (required[i].missing==true) {
			$("label").each(function() {
				if (this.id==required[i].name) {
					this.style.color = "Red";
					$(this).popover('show');
				}
			});
			$(this).prop("disabled",false);
			return;
		}
	}
	var storageName = this.name;
	// use sessionStorage as cache for parameters
	try {
		sessionStorage[storageName] = params;
	} catch(e) {
		// Rethrow exception if it's not a SecurityError. Note that SecurityError exception is specific to Firefox.
		if (e.name !== 'SecurityError') throw e;
	}
	if (typeof(myForm) !== "undefined" && myButton.attr('confirm')) {
		if (confirm(myButton.attr('confirm'))!=true) {
			myButton.prop("disabled",false);
			return;
		}
	}
	if (typeof(localPreprocess) === 'function') {
		if (localPreprocess(params)==-1) return;
	}
	// load new SPA sub page
	$.get(myHost+params, function(data) {
		$("#spa").html(data);
		// clean cache on sessionStorage
		try {
			if ($("#removeCache")) sessionStorage.removeItem(storageName);
		} catch(e) {
			// Rethrow exception if it's not a SecurityError. Note that SecurityError exception is specific to Firefox.
			if (e.name !== 'SecurityError') throw e;
		}
		spaPostprocess();
		 if (typeof(localPostprocess) === 'function') localPostprocess(params);
	}).fail(function() {
		if (params!='') myAlert("Error in data transfer.\nYour data have been saved on your device.\nPlease retry later"); 
	});
} 
 
// modify something to SPA new subpage just after loading it
function spaPostprocess() {
	// add some data from Cordova app plugins
	if (app) {
		if ( $("#geolocation") && myLocation) $("#geolocation").val(myLocation);
		if ($("#geolocationEnabled")) {
			var watchId = navigator.geolocation.watchPosition(geolocationSuccess,
				geolocationError,
				{maximumAge: 3000, timeout: 5000, enableHighAccuracy: false});
		}
		if ($("#device_id")) $("#device_id").val("Device Model: "    + device.model    + ',' +
			'Device Cordova: '  + device.cordova  + ',' +
			'Device Platform: ' + device.platform + ',' +
			'Device UUID: '     + device.uuid     + ',' +
			'Device Version: '  + device.version);
	}
	// restore data memorized in localStorage
	try {
		for (var i in localStorage) {
			if (localStorage[i] && $("#"+i).length) {
				$("#"+i).val(localStorage[i]);
			}
		}
	} catch(e) {
		// Rethrow exception if it's not a SecurityError. Note that SecurityError exception is specific to Firefox.
		if (e.name !== 'SecurityError') throw e;
	}
	// add to each label popover attributes, but only if input is required
	$("label").each(function() {
		if (this.classList.contains('required') || (this.getAttribute("for") && $('#'+this.getAttribute("for")).prop('required'))) {
			this.setAttribute('title', 'Warning');
			this.setAttribute('data-toggle', 'popover');
			this.setAttribute('data-content', 'Please fill this input area');
			this.setAttribute('data-placement', 'top');
			if (this.getAttribute("for")) {
				$('#'+this.getAttribute("for")).bind(inputEvent, hidePopover);
			}
			else {
				var names = $("[name='"+this.id+"']");
				for (n=0; n<names.length; n++) {
					$(names[n]).bind(inputEvent, hidePopover);
				}
			}
		}
	})

	$('[data-toggle="popover"]').popover();

	// add submit action to all buttons (with some exceptions)
	$("button").each(function() {
		if (!this.classList.contains('noSubmit')) {
			this.addEventListener(buttonEvent, myCallback, false);
		}
		// restore data memorized in sessionStorage
		try {
			if (sessionStorage[this.name]) {
				var params = sessionStorage[this.name].split('&');
				for (i=0; i<params.length; i++) {
					p = params[i].split('=');
					if (document.getElementById(p[0])) {
						if (document.getElementById(p[0]).type=='checkbox') document.getElementById(p[0]).checked;
						else document.getElementById(p[0]).value = p[1]; 
					}
					else {
						var radioInput = document.getElementsByName(p[0]);
						for (j=0; j<radioInput.length; j++) {
							if (radioInput[j].type=='radio' && radioInput[j].value==p[1]) {
								radioInput[j].checked = true;
							}
						}
					}
				}
			}
		} catch(e) {
			// Rethrow exception if it's not a SecurityError. Note that SecurityError exception is specific to Firefox.
			if (e.name !== 'SecurityError') throw e;
		}
	});
}

function hidePopover() {
	$('[data-toggle="popover"]').popover('hide'); 
}

var geolocationSuccess = function(position) {
	myLocation = "Latitude: "          + position.coords.latitude          + ',' +
		'Longitude: '         + position.coords.longitude         + ',' +
		'Accuracy: '          + position.coords.accuracy          + ',' +
		// 'Altitude: '          + position.coords.altitude          + ',' +
		// 'Altitude Accuracy: ' + position.coords.altitudeAccuracy  + ',' +
		// 'Heading: '           + position.coords.heading           + ',' +
		// 'Speed: '             + position.coords.speed             + ',' +
		'Timestamp: '         + position.timestamp;
};

// onError Callback receives a PositionError object
function geolocationError(error) {
    // myAlert('code: '    + error.code    + '\n' + 'message: ' + error.message + '\n');
}

function disableForm() {
	if (lastStatus != 'disconnected') {
		lastStatus = 'disconnected';
		$("#spa").html('<h1>&nbsp;</h1>'+"This app need network connection.");
	}
}
function enableForm() {
	if (lastStatus != 'connected' && lastStatus != '') {
		lastStatus = 'connected';
		navigator.notification.alert("Connection restored.",null,"Online!");
		myCallback();
	}
}

function myAlert(param) {
	if (app) {
		navigator.notification.alert(param, null, "Warning!");
	} 
	else {
		alert(param);
	}  
}  

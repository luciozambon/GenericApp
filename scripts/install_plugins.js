#!/usr/bin/env node
//this hook installs all your plugins
// add your plugins to this list--either
// the identifier, the filesystem location
// or the URL
var pluginlist = [
"cordova-plugin-device",
"cordova-plugin-dialogs",
"cordova-plugin-geolocation",
"cordova-plugin-network-information"
];
// no need to configure below
var exec = require('child_process').exec;
function puts(error, stdout, stderr) {
console.log(stdout);
}
pluginlist.forEach(function(plug) {
exec("cordova plugin add " + plug, puts);
});
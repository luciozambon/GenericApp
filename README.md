# GenericApp
An Apache Cordova app developed to be as generic as possible

In Apache Cordova you can use InAppBrowser and navigate any web site you like. So the programmer can change the user experience modifying only the web server part. The user doesn't need to update his/her installation.

But in the InAppBrowser all Apache Cordova plugins are disabled.

GenericApp try to combine any of the features offered by the plugins with the flexibility of putting all the contents on a web server.

At startup this is only a proof of concept, all aspects can be improved and any reasonable contribution is welcome. The hope is to produce an industry quality app template.

The app is a SPA that is an almost empty framework which is fixed. Inside this framework subpages are loaded from a web server according with user interaction.

When a user press a button, a JavaScript callback look for a &lt;form&gt; tag containing this button and all &lt;input&gt; tags in the frame.

All parameters are sent to the web server using a JQuery $.get() call which implement an AJAX call.

If any input is empty and required then a bootstrap prompt is created.

Plugins are configured through tag attributes and classes (IMHO this is a topic for long discussions). In the first version only a few plugins are supported i.e. geolocation and device.

A button can have a 'confirm' attribute, in this case a confirmation modal is created.

All data are temporarily buffered before the $.get() call and removed on success.

Some input can be configured to be saved permanently on the mobile device.

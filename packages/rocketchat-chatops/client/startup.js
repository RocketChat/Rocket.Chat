/* globals GoogleMaps */
Meteor.startup(function() {
	console.log('startup hooked');
	return GoogleMaps.load();
});

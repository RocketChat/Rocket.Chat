Template.videoFlexTab.helpers({

});


Template.videoFlexTab.onCreated(function() {
	this.timeout = null;
	this.autorun(() => {

	});

	// Opening a PR so we can do this via the https://meet.jit.si/external_api.js
	$.getScript( "https://cdn.rawgit.com/geekgonecrazy/jitsi-meet/master/external_api.js" )
		.done(function( script, textStatus ) {
			var domain = "meet.jit.si"; // Need to get from settings
			var room = "a124124124124124125125126"; // Need to calc from instance id and room id
			var width = 500;
			var height = 500;

			var configOverwrite = {};
			var interfaceConfigOverwrite = {};

			var api = new JitsiMeetExternalAPI(domain, room, width, height, document.getElementById('videoContainer'), configOverwrite, interfaceConfigOverwrite, true);

			// This for sure needs to be an onReady of some sort instead
			setTimeout(() => {
				api.executeCommand('displayName', [Meteor.user().name])
			}, 3000);

		})
		.fail(function( jqxhr, settings, exception ) {
			// Show an error
		});

});

Template.videoFlexTab.events({

});

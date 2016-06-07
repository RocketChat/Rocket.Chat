/* globals JitsiMeetExternalAPI */

Template.videoFlexTab.helpers({

});

Template.videoFlexTab.onCreated(function() {
	let rid = this.data && this.data.rid;
	this.timeout = null;
	this.autorun(() => {
		if (RocketChat.settings.get('Jitsi_Enabled')) {
			if (RocketChat.TabBar.getTemplate() === 'videoFlexTab') {
				if (RocketChat.TabBar.isFlexOpen()) {
					Meteor.call('jitsi:connect', rid);
				} else {
					Meteor.call('jitsi:disconnect', rid);
				}
			}
		}
	});

	// Opening a PR so we can do this via the https://meet.jit.si/external_api.js
	$.getScript('https://cdn.rawgit.com/geekgonecrazy/jitsi-meet/master/external_api.js')
		.done(function() {
			var domain = RocketChat.settings.get('Jitsi_Domain') || 'meet.jit.si'; // Check if default should be set or not
			var room = CryptoJS.MD5(RocketChat.settings.get('uniqueID') + rid).toString();
			console.log(room);

			var width = 500;
			var height = 500;

			var configOverwrite = {};
			var interfaceConfigOverwrite = {};

			var api = new JitsiMeetExternalAPI(domain, room, width, height, document.getElementById('videoContainer'), configOverwrite, interfaceConfigOverwrite, RocketChat.settings.get('Jitsi_SSL') ? false : true);

			// This for sure needs to be an onReady of some sort instead
			setTimeout(() => {
				api.executeCommand('displayName', [Meteor.user().name]);
			}, 3000);

		})
		.fail(function() {
			// Show an error
		});
});

Template.videoFlexTab.events({

});

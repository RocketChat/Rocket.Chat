/* globals JitsiMeetExternalAPI */

Template.videoFlexTab.helpers({

});

Template.videoFlexTab.onCreated(function() {
	let rid = this.data && this.data.rid;
	let api;

	let timeOut = null;

	this.timeout = null;
	this.autorun(() => {
		if (RocketChat.settings.get('Jitsi_Enabled')) {
			if (RocketChat.TabBar.getTemplate() === 'videoFlexTab') {
				if (RocketChat.TabBar.isFlexOpen()) {
					RocketChat.TabBar.updateButton('video', { class: 'red' });
				} else {
					RocketChat.TabBar.updateButton('video', { class: '' });

					if (timeOut) {
						console.log(timeOut);
						api.dispose();
						clearInterval(timeOut);
					}
				}
			}
		}
	});

	// Opening a PR so we can do this via the https://meet.jit.si/external_api.js
	$.getScript('https://cdn.rawgit.com/geekgonecrazy/jitsi-meet/master/external_api.js')
		.done(function() {
			var domain = RocketChat.settings.get('Jitsi_Domain');
			var room = CryptoJS.MD5(RocketChat.settings.get('uniqueID') + rid).toString();
			console.log(room);

			var width = 500;
			var height = 500;

			var configOverwrite = {};
			var interfaceConfigOverwrite = {};

			api = new JitsiMeetExternalAPI(domain, room, width, height, document.getElementById('videoContainer'), configOverwrite, interfaceConfigOverwrite, RocketChat.settings.get('Jitsi_SSL') ? false : true);

			// This for sure needs to be an onReady of some sort instead
			setTimeout(() => {
				api.executeCommand('displayName', [Meteor.user().name]);
			}, 3000);

			Meteor.call('jitsi:updateTimeout', rid);

			timeOut = setInterval(() => Meteor.call('jitsi:updateTimeout', rid), 10*1000)

		})
		.fail(function() {
			// Show an error
		});
});

Template.videoFlexTab.events({

});

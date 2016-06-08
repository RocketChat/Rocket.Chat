/* globals JitsiMeetExternalAPI */

Template.videoFlexTab.helpers({

});

Template.videoFlexTab.onCreated(function() {
	let rid = this.data && this.data.rid;
	let api;

	let timeOut = null;

	let domain = RocketChat.settings.get('Jitsi_Domain');
	let jitsiRoom = CryptoJS.MD5(RocketChat.settings.get('uniqueID') + rid).toString();
	let noSsl = RocketChat.settings.get('Jitsi_SSL') ? false : true;

	let width = 500;
	let height = 500;

	let configOverwrite = {};
	let interfaceConfigOverwrite = {};

	this.timeout = null;
	this.autorun(() => {
		if (RocketChat.settings.get('Jitsi_Enabled')) {
			if (RocketChat.TabBar.getTemplate() === 'videoFlexTab') {
				if (RocketChat.TabBar.isFlexOpen()) {
					RocketChat.TabBar.updateButton('video', { class: 'red' });

					// Lets make sure its loaded before we try to show it.
					if (typeof JitsiMeetExternalAPI !== undefined) {

						// Keep it from showing duplicates when re-evaluated on variable change.
						if (!document.getElementById('jitsiConference0')) {
							api = new JitsiMeetExternalAPI(domain, jitsiRoom, width, height, document.getElementById('videoContainer'), configOverwrite, interfaceConfigOverwrite, noSsl);

							/*
							* Hack to send after frame is loaded.
							* postMessage converts to events in the jitsi meet iframe.
							* For some reason those aren't working right.
							*/
							setTimeout(() => {
								api.executeCommand('displayName', [Meteor.user().name]);
							}, 3000);

							Meteor.call('jitsi:updateTimeout', rid);

							timeOut = setInterval(() => Meteor.call('jitsi:updateTimeout', rid), 10*1000);
						}

						// Execute any commands that might be reactive.  Like name changing.
						api.executeCommand('displayName', [Meteor.user().name]);

					}

				} else {
					RocketChat.TabBar.updateButton('video', { class: '' });

					// Clean up and stop updating timeout.
					if (timeOut) {
						api.dispose();
						clearInterval(timeOut);
					}
				}
			}
		}
	});

});

Template.videoFlexTab.events({

});

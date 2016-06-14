/* globals JitsiMeetExternalAPI */

Template.videoFlexTab.helpers({

});

Template.videoFlexTab.onCreated(function() {
	let rid = this.data && this.data.rid;
	let api;

	let timeOut = null;

	let width = 500;
	let height = 500;

	let configOverwrite = {};
	let interfaceConfigOverwrite = {'SHOW_JITSI_WATERMARK': false};

	let jitsiRoomActive = null;

	this.timeout = null;
	this.autorun(() => {
		if (RocketChat.settings.get('Jitsi_Enabled')) {
			if (RocketChat.TabBar.getTemplate() === 'videoFlexTab') {
				if (RocketChat.TabBar.isFlexOpen()) {
					let roomId = Session.get('openedRoom');

					let domain = RocketChat.settings.get('Jitsi_Domain');
					let jitsiRoom = 'RocketChat' + CryptoJS.MD5(RocketChat.settings.get('uniqueID') + roomId).toString();
					let noSsl = RocketChat.settings.get('Jitsi_SSL') ? false : true;
					console.debug('Jitsi Room ID:', jitsiRoom, 'If from direct message or private group don\'t share.  Or you will be letting the invitee join any future conversation.');

					if (jitsiRoomActive !== null && jitsiRoomActive !== jitsiRoom) {
						jitsiRoomActive = null;

						console.log('Room Changed... Close panel!');
						// Reset things.  Should probably be handled better in closeFlex()
						$('.flex-tab').css('max-width', '');
						$('.main-content').css('right', '');

						RocketChat.TabBar.closeFlex();

						RocketChat.TabBar.updateButton('video', { class: '' });

						// Clean up and stop updating timeout.
						if (timeOut) {
							api.dispose();
							clearInterval(timeOut);
						}
					} else {
						jitsiRoomActive = jitsiRoom;

						RocketChat.TabBar.updateButton('video', { class: 'red' });

						// Lets make sure its loaded before we try to show it.
						if (typeof JitsiMeetExternalAPI !== undefined) {

							// Keep it from showing duplicates when re-evaluated on variable change.
							if (!$('[id^=jitsiConference]').length) {
								api = new JitsiMeetExternalAPI(domain, jitsiRoom, width, height, document.getElementById('videoContainer'), configOverwrite, interfaceConfigOverwrite, noSsl);

								/*
								* Hack to send after frame is loaded.
								* postMessage converts to events in the jitsi meet iframe.
								* For some reason those aren't working right.
								*/
								Meteor.setTimeout(() => {
									api.executeCommand('displayName', [Meteor.user().name]);
								}, 5000);

								Meteor.call('jitsi:updateTimeout', rid);

								timeOut = Meteor.setInterval(() => Meteor.call('jitsi:updateTimeout', rid), 10*1000);
							}

							// Execute any commands that might be reactive.  Like name changing.
							api.executeCommand('displayName', [Meteor.user().name]);

						}
					}

				} else {
					RocketChat.TabBar.updateButton('video', { class: '' });

					// Clean up and stop updating timeout.
					if (timeOut) {
						Meteor.defer(api.dispose());
						clearInterval(timeOut);
					}
				}
			}
		}
	});

});

Template.videoFlexTab.events({

});

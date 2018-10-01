/* globals JitsiMeetExternalAPI */
/* eslint new-cap: [2, {"capIsNewExceptions": ["MD5"]}] */

Template.videoFlexTab.helpers({
	openInNewWindow() {
		if (Meteor.isCordova) {
			return true;
		} else {
			return RocketChat.settings.get('Jitsi_Open_New_Window');
		}
	},
});

Template.videoFlexTab.onCreated(function() {
	this.tabBar = Template.currentData().tabBar;
});

Template.videoFlexTab.onRendered(function() {
	this.api = null;

	let timeOut = null;

	const width = 'auto';
	const height = 500;

	const configOverwrite = {
		desktopSharingChromeExtId: RocketChat.settings.get('Jitsi_Chrome_Extension'),
	};
	const interfaceConfigOverwrite = {};

	let jitsiRoomActive = null;

	const closePanel = () => {
		// Reset things.  Should probably be handled better in closeFlex()
		$('.flex-tab').css('max-width', '');
		$('.main-content').css('right', '');

		this.tabBar.close();

		RocketChat.TabBar.updateButton('video', { class: '' });
	};

	modal.open({
		title: t('Video_Conference'),
		text: t('Start_video_call'),
		type: 'warning',
		showCancelButton: true,
		confirmButtonText: t('Yes'),
		cancelButtonText: t('Cancel'),
		html: false,
	}, (dismiss) => {
		if (!dismiss) {
			return closePanel();
		}
		this.timeout = null;
		this.autorun(async () => {
			if (RocketChat.settings.get('Jitsi_Enabled')) {
				if (this.tabBar.getState() === 'opened') {
					const roomId = Session.get('openedRoom');

					const domain = RocketChat.settings.get('Jitsi_Domain');
					const uniqueID = RocketChat.settings.get('uniqueID');
					const noSsl = !RocketChat.settings.get('Jitsi_SSL');

					let jitsiRoom = '';
					if (typeof uniqueID !== 'undefined') {
						jitsiRoom = RocketChat.settings.get('Jitsi_URL_Room_Prefix') + uniqueID + roomId;
					} else {
						jitsiRoom = RocketChat.settings.get('Jitsi_URL_Room_Prefix') + roomId;
					}

					if (jitsiRoomActive !== null && jitsiRoomActive !== jitsiRoom) {
						jitsiRoomActive = null;

						closePanel();

						// Clean up and stop updating timeout.
						Meteor.defer(() => this.api && this.api.dispose());
						if (timeOut) {
							clearInterval(timeOut);
						}
					} else {

						let accessToken = await new Promise((resolve, reject) =>
							Meteor.call('jitsi:generateAccessToken', (error, result) => {
								if (error) {
									return reject(error);
								}
								resolve(result);
							})
						);

						console.log('Init conference...');

						jitsiRoomActive = jitsiRoom;

						RocketChat.TabBar.updateButton('video', {class: 'red'});

						// we need to token authentication for our domain - travelmeet.de
						console.log('Your personal access token: ' + accessToken);

						if (RocketChat.settings.get('Jitsi_Open_New_Window') || Meteor.isCordova) {

							console.log('Opening a conference in a NEW tab');

							Meteor.call('jitsi:updateTimeout', roomId);

							timeOut = Meteor.setInterval(() => Meteor.call('jitsi:updateTimeout', roomId), 10 * 1000);
							let newWindow = null;
							if (Meteor.isCordova) {
								newWindow = window.open(`${ (noSsl ? 'http://' : 'https://') + domain }/${ jitsiRoom }?jwt=${ accessToken }`, '_system');
								closePanel();
								clearInterval(timeOut);
							} else {
								newWindow = window.open(`${ (noSsl ? 'http://' : 'https://') + domain }/${ jitsiRoom }?jwt=${ accessToken }`, jitsiRoom);
								const closeInterval = setInterval(() => {
									if (newWindow.closed !== false) {
										closePanel();
										clearInterval(closeInterval);
										clearInterval(timeOut);
									}
								}, 300);
							}
							if (newWindow) {
								newWindow.focus();
							}

							// Lets make sure its loaded before we try to show it.
						} else if (typeof JitsiMeetExternalAPI !== 'undefined') {

							// Keep it from showing duplicates when re-evaluated on variable change.
							if (!$('[id^=jitsiConference]').length) {

								console.log('Opening a conference in THIS tab');

								this.api = new JitsiMeetExternalAPI(domain, jitsiRoom, width, height, this.$('.video-container').get(0), configOverwrite, interfaceConfigOverwrite, noSsl, accessToken);

								/*
								* Hack to send after frame is loaded.
								* postMessage converts to events in the jitsi meet iframe.
								* For some reason those aren't working right.
								*/
								Meteor.setTimeout(() => {
									this.api.executeCommand('displayName', [Meteor.user().name]);
								}, 5000);

								Meteor.call('jitsi:updateTimeout', roomId);

								timeOut = Meteor.setInterval(() => Meteor.call('jitsi:updateTimeout', roomId), 10 * 1000);
							}

							// Execute any commands that might be reactive.  Like name changing.
							this.api && this.api.executeCommand('displayName', [Meteor.user().name]);
						}
					}
				} else {
					RocketChat.TabBar.updateButton('video', { class: '' });

					// Clean up and stop updating timeout.
					if (timeOut) {
						Meteor.defer(() => this.api && this.api.dispose());
						clearInterval(timeOut);
					}
				}

			}

		});
	});
});


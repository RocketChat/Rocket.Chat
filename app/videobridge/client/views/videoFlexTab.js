import { FlowRouter } from 'meteor/kadira:flow-router';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { settings } from '../../../settings';
import { modal, TabBar } from '../../../ui-utils';
import { t } from '../../../utils';

Template.videoFlexTab.helpers({
	openInNewWindow() {
		return settings.get('Jitsi_Open_New_Window');
	},
});

Template.videoFlexTab.onCreated(function() {
	this.tabBar = Template.currentData().tabBar;
});

Template.videoFlexTab.onRendered(function() {
	this.timeOut = null;
	this.isCallRecipient = Boolean(parseInt(FlowRouter.current().queryParams.forceJitsiConnection));
	this.roomId = Session.get('openedRoom');

	const resetQueryParams = () => {
		FlowRouter.go(FlowRouter.current().path.replace(/\?.*/, ''));
	};

	const closePanel = () => {
		// Reset things.  Should probably be handled better in closeFlex()
		$('.flex-tab').css('max-width', '');
		$('.main-content').css('right', '');

		this.tabBar.close();

		TabBar.updateButton('video', { class: '' });

		if (this.timeOut) {
			if (this.isCallRecipient) {
				resetQueryParams();
			} else {
				Meteor.call('jitsi:rejectCall', this.roomId, 'jitsi_call_finished_creator');
			}
		}
	};

	this.tryRunJitsiConnection = async() => {
		setTimeout(function() {
			// todo this function is static JitsiCallHandler.rejectCallGlobal() need import them instead
			// additional protection against simultaneous calls
			document.getElementById('jitsi-sound').pause();
			modal.close();
		}, 250);
		this.api = null;

		const width = 'auto';
		const height = 500;

		const configOverwrite = {
			desktopSharingChromeExtId: settings.get('Jitsi_Chrome_Extension'),
		};
		const interfaceConfigOverwrite = {};

		let jitsiRoomActive = null;

		if (settings.get('Jitsi_Enabled')) {
			if (this.tabBar.getState() === 'opened') {

				const domain = settings.get('Jitsi_Domain');
				const jitsiRoom = settings.get('Jitsi_URL_Room_Prefix') + settings.get('uniqueID') + this.roomId;
				const noSsl = !settings.get('Jitsi_SSL');

				if (jitsiRoomActive !== null && jitsiRoomActive !== jitsiRoom) {
					jitsiRoomActive = null;

					closePanel();

					// Clean up and stop updating timeout.
					Meteor.defer(() => this.api && this.api.dispose());
					if (this.timeOut) {
						clearInterval(this.timeOut);
					}
				} else if (!this.timeOut) {
					jitsiRoomActive = jitsiRoom;

					TabBar.updateButton('video', { class: 'red' });

					if (settings.get('Jitsi_Open_New_Window')) {
						Meteor.call('jitsi:updateTimeout', this.roomId);

						this.timeOut = Meteor.setInterval(() => Meteor.call('jitsi:updateTimeout', this.roomId), 10 * 1000);
						const newWindow = window.open(`${ (noSsl ? 'http://' : 'https://') + domain }/${ jitsiRoom }`, jitsiRoom);
						const closeInterval = setInterval(() => {
							if (newWindow.closed !== false) {
								closePanel();
								clearInterval(closeInterval);
								clearInterval(this.timeOut);
							}
						}, 300);
						if (newWindow) {
							newWindow.focus();
						}


						// Lets make sure its loaded before we try to show it.
					} else if (typeof JitsiMeetExternalAPI !== 'undefined') {

						// Keep it from showing duplicates when re-evaluated on variable change.
						if (!$('[id^=jitsiConference]').length) {
							this.api = new JitsiMeetExternalAPI(domain, jitsiRoom, width, height, this.$('.video-container').get(0), configOverwrite, interfaceConfigOverwrite, noSsl);

							/*
							* Hack to send after frame is loaded.
							* postMessage converts to events in the jitsi meet iframe.
							* For some reason those aren't working right.
							*/
							Meteor.setTimeout(() => {
								this.api.executeCommand('displayName', [Meteor.user().name]);
							}, 5000);

							Meteor.call('jitsi:updateTimeout', this.roomId);

							this.timeOut = Meteor.setInterval(() => Meteor.call('jitsi:updateTimeout', this.roomId), 10 * 1000);
						}

						// Execute any commands that might be reactive.  Like name changing.
						this.api && this.api.executeCommand('displayName', [Meteor.user().name]);
					}
				}
			} else {
				TabBar.updateButton('video', { class: '' });

				// Clean up and stop updating timeout.
				if (this.timeOut) {
					Meteor.defer(() => this.api && this.api.dispose());
					clearInterval(this.timeOut);
					resetQueryParams();
				}
			}

		}
	};

	if (this.isCallRecipient) {
		this.autorun(this.tryRunJitsiConnection);
	} else {
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
			this.autorun(this.tryRunJitsiConnection);
		}, () => closePanel());
	}
});

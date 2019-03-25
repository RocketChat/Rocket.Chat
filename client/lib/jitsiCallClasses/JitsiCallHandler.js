import { FlowRouter } from 'meteor/kadira:flow-router';
import { Meteor } from 'meteor/meteor';
import toastr from 'toastr';
import { modal } from '../../../app/ui-utils';
import { t } from '../../../app/utils';

export class JitsiCallHandler {
	static getAudioElement() {
		return document.getElementById('jitsi-sound');
	}

	constructor(payload) {
		if (payload === undefined) {
			throw new Error('Parameter payload is required');
		}
		this.payload = payload;
		this.audioElement = JitsiCallHandler.getAudioElement();
	}

	handle() {
		if (Meteor.userId() !== this.payload.sender._id) {
			this.playIncomeSound();
			this.showIncomeModal();
		}
	}

	playIncomeSound() {
		this.audioElement.play();
	}

	stopIncomeSound() {
		this.audioElement.pause();
	}

	showIncomeModal() {
		modal.open({
			title: `${ t('Video_Conference_From') } ${ this.payload.sender.username }`,
			text: t('Accept_video_call'),
			type: 'warning',
			showCancelButton: true,
			confirmButtonText: t('Yes'),
			cancelButtonText: t('Cancel'),
			allowOutsideClick: false,
			html: false,
		}, () => {
			this.goToCallingRoom();
		}, () => {
			this.stopIncomeSound();
			this.rejectCall();
		});
	}

	goToCallingRoom() {
		this.stopIncomeSound();
		toastr.info('Connecting...');
		FlowRouter.goToRoomByIdWithParams(this.payload.rid, { forceJitsiConnection: 1, jitsiMessage: this.payload._id });
		// after that render room and joinToJitsiConference( messageId ) activate
	}

	rejectCall() {
		// when someone reject a call, a system message is sent to the room
		Meteor.call('jitsi:rejectCall', this.payload.rid);
	}

	static rejectCallGlobal() {
		JitsiCallHandler.getAudioElement().pause();
		modal.close();
	}
}

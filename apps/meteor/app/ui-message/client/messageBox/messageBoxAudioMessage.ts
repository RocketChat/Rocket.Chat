import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import type { Blaze } from 'meteor/blaze';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';

import { settings } from '../../../settings/client';
import { AudioRecorder, fileUpload, USER_ACTIVITIES, UserAction } from '../../../ui/client';
import { t } from '../../../utils/client';
import './messageBoxAudioMessage.html';

type MessageBoxAudioMessageTemplate = Blaze.TemplateInstance<{
	rid: IRoom['_id'];
	tmid?: IMessage['_id'];
}> & {
	time: ReactiveVar<string>;
	state: ReactiveVar<'loading' | 'recording' | 'uploading' | null>;
	isMicrophoneDenied: ReactiveVar<boolean>;
};

const startRecording = async (rid: IRoom['_id'], tmid?: IMessage['_id']) => {
	try {
		await AudioRecorder.start();
		UserAction.performContinuously(rid, USER_ACTIVITIES.USER_RECORDING, { tmid });
	} catch (error) {
		throw error;
	}
};

const stopRecording = async (rid: IRoom['_id'], tmid?: IMessage['_id']): Promise<Blob> => {
	const result = await new Promise<Blob>((resolve) => AudioRecorder.stop(resolve));
	UserAction.stop(rid, USER_ACTIVITIES.USER_RECORDING, { tmid });
	return result;
};

const recordingInterval = new ReactiveVar<ReturnType<typeof setInterval> | undefined>(undefined);
const recordingRoomId = new ReactiveVar(null);

const clearIntervalVariables = () => {
	if (recordingInterval.get()) {
		clearInterval(recordingInterval.get());
		recordingInterval.set(undefined);
		recordingRoomId.set(null);
	}
};

const cancelRecording = async (instance: MessageBoxAudioMessageTemplate, rid: IRoom['_id'], tmid?: IMessage['_id']): Promise<Blob> => {
	clearIntervalVariables();

	instance.time.set('00:00');

	const blob = await stopRecording(rid, tmid);

	instance.state.set(null);

	return blob;
};

Template.messageBoxAudioMessage.onCreated(async function (this: MessageBoxAudioMessageTemplate) {
	this.state = new ReactiveVar(null);
	this.time = new ReactiveVar('00:00');
	this.isMicrophoneDenied = new ReactiveVar(false);

	if (navigator.permissions) {
		try {
			const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
			this.isMicrophoneDenied.set(permissionStatus.state === 'denied');
			permissionStatus.onchange = () => {
				this.isMicrophoneDenied.set(permissionStatus.state === 'denied');
			};
			return;
		} catch (error) {
			console.warn(error);
		}
	}

	if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
		this.isMicrophoneDenied.set(true);
		return;
	}

	try {
		if (!(await navigator.mediaDevices.enumerateDevices()).some(({ kind }) => kind === 'audioinput')) {
			this.isMicrophoneDenied.set(true);
			return;
		}
	} catch (error) {
		console.warn(error);
	}
});

Template.messageBoxAudioMessage.onDestroyed(async function (this: MessageBoxAudioMessageTemplate) {
	if (this.state.get() === 'recording') {
		const { rid, tmid } = this.data;
		await cancelRecording(this, rid, tmid);
	}
});

Template.messageBoxAudioMessage.helpers({
	isAllowed() {
		return (
			AudioRecorder.isSupported() &&
			!(Template.instance() as MessageBoxAudioMessageTemplate).isMicrophoneDenied.get() &&
			settings.get('FileUpload_Enabled') &&
			settings.get('Message_AudioRecorderEnabled') &&
			(!settings.get('FileUpload_MediaTypeBlackList') || !settings.get('FileUpload_MediaTypeBlackList').match(/audio\/mp3|audio\/\*/i)) &&
			(!settings.get('FileUpload_MediaTypeWhiteList') || settings.get('FileUpload_MediaTypeWhiteList').match(/audio\/mp3|audio\/\*/i))
		);
	},

	stateClass() {
		if (recordingRoomId.get() && recordingRoomId.get() !== Template.currentData().rid) {
			return 'rc-message-box__audio-message--busy';
		}

		const state = (Template.instance() as MessageBoxAudioMessageTemplate).state.get();
		return state && `rc-message-box__audio-message--${state}`;
	},

	time() {
		return (Template.instance() as MessageBoxAudioMessageTemplate).time.get();
	},
});

Template.messageBoxAudioMessage.events({
	async 'click .js-audio-message-record'(event: JQuery.ClickEvent, instance: MessageBoxAudioMessageTemplate) {
		event.preventDefault();

		if (recordingRoomId.get() && recordingRoomId.get() !== this.rid) {
			return;
		}

		instance.state.set('recording');

		try {
			await startRecording(this.rid, this.tmid);
			const startTime = new Date();
			recordingInterval.set(
				setInterval(() => {
					const now = new Date();
					const distance = (now.getTime() - startTime.getTime()) / 1000;
					const minutes = Math.floor(distance / 60);
					const seconds = Math.floor(distance % 60);
					instance.time.set(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
				}, 1000),
			);
			recordingRoomId.set(this.rid);
		} catch (error) {
			console.log(error);
			instance.isMicrophoneDenied.set(true);
			instance.state.set(null);
		}
	},

	async 'click .js-audio-message-cancel'(event: JQuery.ClickEvent, instance: MessageBoxAudioMessageTemplate) {
		event.preventDefault();

		await cancelRecording(instance, this.rid, this.tmid);
	},

	async 'click .js-audio-message-done'(event: JQuery.ClickEvent, instance: MessageBoxAudioMessageTemplate) {
		event.preventDefault();

		instance.state.set('loading');

		const { rid, tmid } = this;
		const blob = await cancelRecording(instance, rid, tmid);

		const fileName = `${t('Audio record')}.mp3`;
		const file = new File([blob], fileName, { type: 'audio/mpeg' });

		await fileUpload([{ file, name: fileName }], undefined, { rid, tmid });
	},
});

import type { IMessage } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';

import type { ComposerAPI } from './chats/ChatAPI';
import { createUploadsAPI } from './chats/uploads';
import type { FormattingButton } from './messageBoxFormatting';
import { formattingButtons } from './messageBoxFormatting';
import { settings } from './settings';

type ComposerStateCoreParams = {
	room: { rid: string; tmid?: string };
	prepareQuotedMessage?: (message: IMessage) => IMessage;
};

export type ComposerStateCore = Pick<
	ComposerAPI,
	| 'dismissQuotedMessage'
	| 'dismissAllQuotedMessages'
	| 'quotedMessages'
	| 'setEditingMode'
	| 'editing'
	| 'setRecordingMode'
	| 'recording'
	| 'setRecordingVideo'
	| 'recordingVideo'
	| 'setIsMicrophoneDenied'
	| 'isMicrophoneDenied'
	| 'formatters'
	| 'uploads'
> & {
	addQuotedMessage: (message: IMessage) => void;
	stopFormatterSubscription: () => void;
};

export const createComposerStateCore = ({
	room: { rid, tmid },
	prepareQuotedMessage = (message) => message,
}: ComposerStateCoreParams): ComposerStateCore => {
	const emitter = new Emitter<{
		quotedMessagesUpdate: void;
		editing: void;
		recording: void;
		recordingVideo: void;
		formatting: void;
		mircophoneDenied: void;
	}>();

	let _quotedMessages: IMessage[] = [];

	const notifyQuotedMessagesUpdate = (): void => {
		emitter.emit('quotedMessagesUpdate');
	};

	const addQuotedMessage = (message: IMessage): void => {
		_quotedMessages = [..._quotedMessages.filter((_message) => _message._id !== message._id), prepareQuotedMessage(message)];
		notifyQuotedMessagesUpdate();
	};

	const dismissQuotedMessage = async (mid: IMessage['_id']): Promise<void> => {
		_quotedMessages = _quotedMessages.filter((message) => message._id !== mid);
		notifyQuotedMessagesUpdate();
	};

	const dismissAllQuotedMessages = async (): Promise<void> => {
		_quotedMessages = [];
		notifyQuotedMessagesUpdate();
	};

	const quotedMessages = {
		get: () => _quotedMessages,
		subscribe: (callback: () => void) => emitter.on('quotedMessagesUpdate', callback),
	};

	const [editing, setEditing] = (() => {
		let editing = false;

		return [
			{
				get: () => editing,
				subscribe: (callback: () => void) => emitter.on('editing', callback),
			},
			(value: boolean) => {
				editing = value;
				emitter.emit('editing');
			},
		] as const;
	})();

	const [recording, setRecordingMode] = (() => {
		let recording = false;

		return [
			{
				get: () => recording,
				subscribe: (callback: () => void) => emitter.on('recording', callback),
			},
			(value: boolean) => {
				recording = value;
				emitter.emit('recording');
			},
		] as const;
	})();

	const [recordingVideo, setRecordingVideo] = (() => {
		let recordingVideo = false;

		return [
			{
				get: () => recordingVideo,
				subscribe: (callback: () => void) => emitter.on('recordingVideo', callback),
			},
			(value: boolean) => {
				recordingVideo = value;
				emitter.emit('recordingVideo');
			},
		] as const;
	})();

	const [isMicrophoneDenied, setIsMicrophoneDenied] = (() => {
		let isMicrophoneDenied = false;

		return [
			{
				get: () => isMicrophoneDenied,
				subscribe: (callback: () => void) => emitter.on('mircophoneDenied', callback),
			},
			(value: boolean) => {
				isMicrophoneDenied = value;
				emitter.emit('mircophoneDenied');
			},
		] as const;
	})();

	const setEditingMode = (editing: boolean): void => {
		setEditing(editing);
	};

	const [formatters, stopFormatterSubscription] = (() => {
		let actions: FormattingButton[] = [];

		const recompute = (): void => {
			actions = formattingButtons.filter((button) => !button.condition || button.condition());
			emitter.emit('formatting');
		};
		recompute();
		// Coarse-grained: fires on every setting change, but the only condition()
		// today is Katex_Enabled and the recompute is a cheap zustand read, so the
		// extra work per unrelated setting change is negligible.
		const stop = settings.observe('*', recompute);

		return [
			{
				get: () => actions,
				subscribe: (callback: () => void) => emitter.on('formatting', callback),
			},
			stop,
		] as const;
	})();

	return {
		addQuotedMessage,
		dismissQuotedMessage,
		dismissAllQuotedMessages,
		quotedMessages,
		setEditingMode,
		editing,
		setRecordingMode,
		recording,
		setRecordingVideo,
		recordingVideo,
		setIsMicrophoneDenied,
		isMicrophoneDenied,
		formatters,
		stopFormatterSubscription,
		uploads: createUploadsAPI({ rid, tmid }),
	};
};

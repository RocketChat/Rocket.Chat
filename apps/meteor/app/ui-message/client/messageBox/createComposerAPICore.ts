import type { IMessage } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import type { RefObject } from 'react';

import type { FormattingButton } from './messageBoxFormatting';
import { formattingButtons } from './messageBoxFormatting';
import type { ComposerAPI } from '../../../../client/lib/chats/ChatAPI';
import { createUploadsAPI } from '../../../../client/lib/chats/uploads';
import { settings } from '../../../../client/lib/settings';
import { withDebouncing } from '../../../../lib/utils/highOrderFunctions';

export type SetText = (
	text: string,
	options?: {
		selection?:
			| { readonly start?: number; readonly end?: number }
			| ((previous: { readonly start: number; readonly end: number }) => { readonly start?: number; readonly end?: number });
		skipFocus?: boolean;
	},
) => void;

export const triggerEvent = (input: HTMLElement, evt: string): void => {
	const event = new Event(evt, { bubbles: true });
	// TODO: Remove this hack for react to trigger onChange
	const tracker = (input as any)._valueTracker;
	if (tracker) {
		tracker.setValue(new Date().toString());
	}
	input.dispatchEvent(event);
};

type ComposerAPICoreParams = {
	input: HTMLElement;
	composerRef: RefObject<HTMLElement | null>;
	room: { rid: string; tmid?: string };
	initialValue: string;
	save: () => void;
	setText: SetText;
	focus: ComposerAPI['focus'];
	prepareQuotedMessage?: (message: IMessage) => IMessage;
};

type ComposerAPICore = Pick<
	ComposerAPI,
	| 'release'
	| 'insertText'
	| 'insertNewLine'
	| 'clear'
	| 'focus'
	| 'blur'
	| 'quoteMessage'
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
	| 'composerRef'
	| 'uploads'
>;

export const createComposerAPICore = ({
	input,
	composerRef,
	room: { rid, tmid },
	initialValue,
	save,
	setText,
	focus,
	prepareQuotedMessage = (message) => message,
}: ComposerAPICoreParams): ComposerAPICore => {
	const emitter = new Emitter<{
		quotedMessagesUpdate: void;
		editing: void;
		recording: void;
		recordingVideo: void;
		formatting: void;
		mircophoneDenied: void;
	}>();

	let _quotedMessages: IMessage[] = [];

	const persist = withDebouncing({ wait: 300 })(save);

	const notifyQuotedMessagesUpdate = (): void => {
		emitter.emit('quotedMessagesUpdate');
	};

	const insertText = (text: string): void => {
		setText(text, {
			selection: ({ start, end }) => ({
				start: start + text.length,
				end: end + text.length,
			}),
		});
	};

	const clear = (): void => {
		setText('');
	};

	const insertNewLine = (): void => insertText('\n');

	const blur = (): void => input.blur();

	const quoteMessage = async (message: IMessage): Promise<void> => {
		_quotedMessages = [..._quotedMessages.filter((_message) => _message._id !== message._id), prepareQuotedMessage(message)];
		notifyQuotedMessagesUpdate();
		input.focus();
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
			actions = formattingButtons.filter(({ condition }) => !condition || condition());
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

	const release = (): void => {
		input.removeEventListener('input', persist);
		stopFormatterSubscription();
	};

	setText(initialValue, {
		skipFocus: true,
	});

	input.addEventListener('input', persist);

	return {
		release,
		insertText,
		insertNewLine,
		clear,
		focus,
		blur,
		quoteMessage,
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
		composerRef,
		uploads: createUploadsAPI({ rid, tmid }),
	};
};

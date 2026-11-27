import type { IMessage } from '@rocket.chat/core-typings';
import type { RefObject } from 'react';

import type { ComposerAPI } from './chats/ChatAPI';
import { createComposerStateCore } from './composerStateCore';
import { withDebouncing } from '../../lib/utils/highOrderFunctions';

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
	discardDraft: () => void;
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
	room,
	initialValue,
	save,
	discardDraft,
	setText,
	focus,
	prepareQuotedMessage,
}: ComposerAPICoreParams): ComposerAPICore => {
	const { addQuotedMessage, stopFormatterSubscription, ...state } = createComposerStateCore({ room, prepareQuotedMessage });

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
		discardDraft();
	};

	const insertNewLine = (): void => insertText('\n');

	const blur = (): void => input.blur();

	const quoteMessage = async (message: IMessage): Promise<void> => {
		addQuotedMessage(message);
		input.focus();
	};

	const persist = withDebouncing({ wait: 300 })(() => {
		if (state.editing.get()) {
			return;
		}

		save();
	});

	const release = (): void => {
		input.removeEventListener('input', persist);
		stopFormatterSubscription();
	};

	setText(initialValue, {
		skipFocus: true,
	});

	input.addEventListener('input', persist);

	return {
		...state,
		composerRef,
		release,
		insertText,
		insertNewLine,
		clear,
		focus,
		blur,
		quoteMessage,
	};
};

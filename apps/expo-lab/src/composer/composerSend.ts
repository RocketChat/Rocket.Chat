import { closeUnclosedCodeBlock } from '../../../meteor/lib/utils/closeUnclosedCodeBlock.ts';
import type { NativeComposerAPI } from './createNativeComposerAPI.ts';

export type SendResult = void | boolean | Promise<void | boolean>;

export type ComposerSendDeps = {
	api: Pick<NativeComposerAPI, 'text' | 'selection' | 'clear' | 'setText' | 'replaceText' | 'userEdit' | 'focus'>;
	// Resolving false means the send failed and the text goes back to the field
	onSubmit: (text: string) => SendResult;
	// Read on every key so a toggled setting applies at once
	sendOnEnter: () => boolean;
};

export type KeyPressLike = { nativeEvent: { key: string } };

const withLineBreak = (text: string, { start, end }: { start: number; end: number }) => `${text.slice(0, start)}\n${text.slice(end)}`;

// Return arrives as onKeyPress and as a line break in onChangeText, and the order between the two is unmeasured on device
// (probe P3), so both orders are handled here
export const createComposerSend = ({ api, onSubmit, sendOnEnter }: ComposerSendDeps) => {
	// Key first: the field's own line break is still to come and must not reach the text
	let expectedBreak: string | null = null;
	// Change first: where the last change inserted a lone line break, which a Return right after then owns
	let insertedBreakAt: number | null = null;

	const submit = (): void => {
		const raw = api.text;
		if (raw.trim() === '') return;
		api.clear();
		api.focus();
		void Promise.resolve(onSubmit(closeUnclosedCodeBlock(raw.trim()))).then((accepted) => {
			if (accepted === false && api.text === '') api.setText(raw);
		});
	};

	const onChangeText = (text: string): void => {
		const swallow = expectedBreak;
		expectedBreak = null;
		insertedBreakAt = null;
		if (swallow !== null && text === swallow) return;
		const { start, end } = api.selection;
		if (start === end && text === withLineBreak(api.text, api.selection)) insertedBreakAt = start;
		api.userEdit(text);
	};

	const onKeyPress = ({ nativeEvent }: KeyPressLike): void => {
		const breakAt = insertedBreakAt;
		insertedBreakAt = null;
		expectedBreak = null;
		if (nativeEvent.key !== 'Enter' || !sendOnEnter()) return;
		if (breakAt !== null && api.text[breakAt] === '\n') {
			api.replaceText('', { start: breakAt, end: breakAt + 1 });
		} else {
			expectedBreak = withLineBreak(api.text, api.selection);
		}
		submit();
	};

	return { submit, onChangeText, onKeyPress };
};

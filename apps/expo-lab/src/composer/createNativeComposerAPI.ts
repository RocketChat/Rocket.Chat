import type { IMessage } from '@rocket.chat/core-typings';

import { wrapSelectionText } from '../../../meteor/client/views/room/composer/messageBox/wrapSelectionText.ts';

export type Selection = { readonly start: number; readonly end: number };
export type NativeComposerState = { readonly text: string; readonly selection: Selection };

type Subscribable<T> = { get(): T; subscribe(callback: () => void): () => void };

type SelectionOption = { readonly start?: number; readonly end?: number };

export type SetTextOptions = { selection?: SelectionOption | ((previous: Selection) => SelectionOption) };

// What the TextInput exposes to the API; the field is never read back, only told to focus or blur
export type FieldHandle = { focus(): void; blur(): void };

const createSubscribable = <T>(initial: T) => {
	let value = initial;
	const listeners = new Set<() => void>();
	return {
		get: () => value,
		set: (next: T) => {
			value = next;
			listeners.forEach((listener) => listener());
		},
		subscribe: (callback: () => void) => {
			listeners.add(callback);
			return () => void listeners.delete(callback);
		},
	};
};

const constant = <T>(value: T): Subscribable<T> => ({ get: () => value, subscribe: () => () => undefined });

const clampSelection = ({ start, end }: Selection, length: number): Selection => {
	const bound = (offset: number) => Math.min(Math.max(offset, 0), length);
	const a = bound(start);
	const b = bound(end);
	return { start: Math.min(a, b), end: Math.max(a, b) };
};

export const createNativeComposerAPI = (initialText = '') => {
	let state: NativeComposerState = { text: initialText, selection: { start: initialText.length, end: initialText.length } };
	const listeners = new Set<() => void>();
	let field: FieldHandle | null = null;
	const quoted = createSubscribable<IMessage[]>([]);
	const editing = createSubscribable(false);

	// One notification per edit, with text and selection already changed together
	const commit = (text: string, selection: Selection) => {
		const next = clampSelection(selection, text.length);
		if (text === state.text && next.start === state.selection.start && next.end === state.selection.end) return;
		state = { text, selection: next };
		listeners.forEach((listener) => listener());
	};

	const replaceRange = (text: string, inserted: string, { start, end }: Selection) => text.slice(0, start) + inserted + text.slice(end);

	// Web's setText: with a selection option the text replaces the current selection, then the option places the range;
	// without one the whole value is replaced and the caret goes to its end
	const setText = (text: string, { selection }: SetTextOptions = {}): void => {
		if (!selection) {
			commit(text, { start: text.length, end: text.length });
			return;
		}
		const previous = state.selection;
		const resolved = typeof selection === 'function' ? selection(previous) : selection;
		commit(replaceRange(state.text, text, previous), { start: resolved.start ?? 0, end: resolved.end ?? text.length });
	};

	const insertText = (text: string): void =>
		setText(text, { selection: ({ start, end }) => ({ start: start + text.length, end: end + text.length }) });

	const replaceText = (text: string, range: Selection): void => {
		const { start, end } = clampSelection(range, state.text.length);
		const caret = start + text.length;
		commit(replaceRange(state.text, text, { start, end }), { start: caret, end: caret });
	};

	const wrapSelection = (pattern: string) => {
		const result = wrapSelectionText(state.text, state.selection, pattern);
		commit(result.text, result.selection);
		return { selectionStart: state.selection.start, selectionEnd: state.selection.end, value: state.text };
	};

	const setCursor = (offset: number) => commit(state.text, { start: offset, end: offset });

	return {
		get text() {
			return state.text;
		},
		get selection() {
			return state.selection;
		},
		getState: () => state,
		subscribe: (callback: () => void) => {
			listeners.add(callback);
			return () => void listeners.delete(callback);
		},

		setText,
		insertText,
		insertNewLine: () => insertText('\n'),
		replaceText,
		wrapSelection,
		clear: () => setText(''),
		substring: (start: number, end?: number) => state.text.substring(start, end),
		getCursorPosition: (): number => state.selection.start,
		setCursorToEnd: () => setCursor(state.text.length),
		setCursorToStart: () => setCursor(0),
		replyWith: async (text: string): Promise<void> => setText(text),

		// A caret or range the user moved. Native never reports our own writes back, and a report equal to the
		// state (an echo) changes nothing, so it can be passed straight from onSelectionChange
		setSelection: (selection: Selection) => commit(state.text, selection),

		// Text the user typed. Native reports the selection after the change, so until it does the caret is the old
		// one moved by the length difference, which keeps a controlled `selection` prop from sending a stale range back
		userEdit: (text: string) => {
			const caret = Math.max(state.selection.end + text.length - state.text.length, 0);
			commit(text, { start: caret, end: caret });
		},

		attachField: (handle: FieldHandle | null) => {
			field = handle;
		},
		focus: () => field?.focus(),
		blur: () => field?.blur(),
		release: () => {
			listeners.clear();
			field = null;
		},

		quotedMessages: { get: quoted.get, subscribe: quoted.subscribe } as Subscribable<IMessage[]>,
		quoteMessage: async (message: IMessage): Promise<void> => {
			if (!quoted.get().some((m) => m._id === message._id)) quoted.set([...quoted.get(), message]);
		},
		dismissQuotedMessage: async (mid: IMessage['_id']): Promise<void> => quoted.set(quoted.get().filter((m) => m._id !== mid)),
		dismissAllQuotedMessages: async (): Promise<void> => quoted.set([]),
		editing: { get: editing.get, subscribe: editing.subscribe } as Subscribable<boolean>,
		setEditingMode: (value: boolean) => editing.set(value),

		recording: constant(false),
		recordingVideo: constant(false),
		isMicrophoneDenied: constant(false),
		setRecordingMode: (_recording: boolean): void => undefined,
		setRecordingVideo: (_recording: boolean): void => undefined,
		setIsMicrophoneDenied: (_denied: boolean): void => undefined,
		formatters: constant<never[]>([]),
		composerRef: { current: null },
	};
};

export type NativeComposerAPI = ReturnType<typeof createNativeComposerAPI>;

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { TextInputSelectionChangeEvent } from 'react-native';

import { createComposerSend, type SendResult } from './composerSend.ts';
import { createNativeComposerAPI, type FieldHandle } from './createNativeComposerAPI.ts';

// The API owns { text, selection }; the field gets both back in the same render through its controlled props
export type NativeComposerOptions = {
	onSubmit: (text: string) => SendResult;
	sendOnEnter: boolean;
};

export function useNativeComposer({ onSubmit, sendOnEnter }: NativeComposerOptions) {
	const [api] = useState(() => createNativeComposerAPI());
	const state = useSyncExternalStore(api.subscribe, api.getState);
	const inputRef = useRef<FieldHandle | null>(null);

	useEffect(() => {
		api.attachField({ focus: () => inputRef.current?.focus(), blur: () => inputRef.current?.blur() });
		return () => api.attachField(null);
	}, [api]);

	// The handlers stay stable and read the latest props, so a toggled setting needs no new field callbacks
	const latest = useRef({ onSubmit, sendOnEnter });
	latest.current = { onSubmit, sendOnEnter };
	const [send] = useState(() =>
		createComposerSend({ api, onSubmit: (text) => latest.current.onSubmit(text), sendOnEnter: () => latest.current.sendOnEnter }),
	);

	const [onSelectionChange] = useState(() => (event: TextInputSelectionChangeEvent) => api.setSelection(event.nativeEvent.selection));

	return {
		api,
		text: state.text,
		selection: state.selection,
		inputRef,
		onChangeText: send.onChangeText,
		onKeyPress: send.onKeyPress,
		onSelectionChange,
		submit: send.submit,
	};
}

export type NativeComposer = ReturnType<typeof useNativeComposer>;

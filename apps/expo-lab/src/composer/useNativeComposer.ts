import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { TextInputSelectionChangeEvent } from 'react-native';

import { createNativeComposerAPI, type FieldHandle } from './createNativeComposerAPI.ts';

// The API owns { text, selection }; the field gets both back in the same render through its controlled props
export function useNativeComposer() {
	const [api] = useState(() => createNativeComposerAPI());
	const state = useSyncExternalStore(api.subscribe, api.getState);
	const inputRef = useRef<FieldHandle | null>(null);

	useEffect(() => {
		api.attachField({ focus: () => inputRef.current?.focus(), blur: () => inputRef.current?.blur() });
		return () => api.attachField(null);
	}, [api]);

	const onChangeText = useCallback((text: string) => api.userEdit(text), [api]);
	const onSelectionChange = useCallback(
		(event: TextInputSelectionChangeEvent) => api.setSelection(event.nativeEvent.selection),
		[api],
	);

	return { api, text: state.text, selection: state.selection, inputRef, onChangeText, onSelectionChange };
}

export type NativeComposer = ReturnType<typeof useNativeComposer>;

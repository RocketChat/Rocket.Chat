import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback, useRef } from 'react';

export const useDraft = (rid: string, serverDraft?: string, tmid?: string) => {
	const storageKey = `messagebox_${rid}${tmid ? `-${tmid}` : ''}`;
	const [localDraft, setLocalDraft] = useLocalStorage<string>(storageKey, '');
	const saveDraft = useEndpoint('POST', '/v1/rooms.saveDraft');
	const initialValueRef = useRef(serverDraft || localDraft);
	const draftRef = useRef<string | null>(null);

	const persistLocal = useCallback(
		(value: string) => {
			draftRef.current = value;
			setLocalDraft(value);
		},
		[setLocalDraft],
	);

	const flushDraft = useCallback(() => {
		if (draftRef.current === null || tmid) {
			return;
		}

		void saveDraft({ rid, draft: draftRef.current });
		draftRef.current = null;
	}, [saveDraft, rid, tmid]);

	return {
		initialValue: initialValueRef.current,
		persistLocal,
		flushDraft,
	};
};

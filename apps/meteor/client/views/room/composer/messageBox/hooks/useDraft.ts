import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useRef } from 'react';

export const useDraft = (rid: string, serverDraft?: string, tmid?: string, threadExists = true) => {
	const storageKey = `messagebox_${rid}${tmid ? `-${tmid}` : ''}`;
	const [localDraft, setLocalDraft] = useLocalStorage<string>(storageKey, '');
	const saveDraft = useEndpoint('POST', '/v1/rooms.saveDraft');
	const initialValueRef = useRef(serverDraft || localDraft);
	const draftRef = useRef<string | null>(null);
	const threadExistsRef = useRef(threadExists);

	useEffect(() => {
		threadExistsRef.current = threadExists;
	}, [threadExists]);

	const persistLocal = useCallback(
		(value: string) => {
			draftRef.current = value;
			setLocalDraft(value);
		},
		[setLocalDraft],
	);

	const flushDraft = useCallback(() => {
		if (draftRef.current === null) {
			return;
		}

		if (tmid && !threadExistsRef.current) {
			draftRef.current = null;
			return;
		}

		void saveDraft({ rid, draft: draftRef.current, ...(tmid && { tmid }) });
		draftRef.current = null;
	}, [saveDraft, rid, tmid]);

	return {
		initialValue: initialValueRef.current,
		persistLocal,
		flushDraft,
	};
};

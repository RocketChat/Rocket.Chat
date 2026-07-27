import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useRef } from 'react';

export const useDraft = (rid: string, serverDraft?: string, tmid?: string, threadExists = true) => {
	const storageKey = `messagebox_${rid}${tmid ? `-${tmid}` : ''}`;
	const saveDraft = useEndpoint('POST', '/v1/rooms.saveDraft');

	const setLocalDraft = useCallback(
		(value?: string) => {
			if (value) {
				localStorage.setItem(storageKey, value);
			} else {
				localStorage.removeItem(storageKey);
			}
		},
		[storageKey],
	);

	const initialValueRef = useRef(serverDraft || localStorage.getItem(storageKey) || '');
	const draftRef = useRef<string | null>(null);
	const threadExistsRef = useRef(threadExists);
	const serverValueRef = useRef(serverDraft ?? '');

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

		const draft = draftRef.current;
		draftRef.current = null;

		if (tmid && !threadExistsRef.current && draft) {
			return;
		}

		if (draft === serverValueRef.current) {
			return;
		}

		serverValueRef.current = draft;

		void saveDraft({ rid, draft, ...(tmid && { tmid }) }).then(() => setLocalDraft());
	}, [saveDraft, rid, tmid, setLocalDraft]);

	return {
		initialValue: initialValueRef.current,
		persistLocal,
		flushDraft,
	};
};

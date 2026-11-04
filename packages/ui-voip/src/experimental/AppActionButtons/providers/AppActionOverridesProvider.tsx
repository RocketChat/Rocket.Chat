import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { usePeekMediaSessionState } from '../../../context';
import AppActionOverridesContext from '../context/AppActionOverridesContext';
import type { AppActionUpdate, MediaCallAppAction } from '../context/MediaCallAppActionsContext';

type OverridesByCall = Record<string, Record<MediaCallAppAction['key'], AppActionUpdate>>;

const AppActionOverridesProvider = ({ children }: { children: ReactNode }) => {
	const [overrides, setOverrides] = useState<OverridesByCall>({});
	const sessionState = usePeekMediaSessionState();

	const setOverride = useCallback((callId: string, key: MediaCallAppAction['key'], update: AppActionUpdate) => {
		setOverrides((prev) => ({ ...prev, [callId]: { ...prev[callId], [key]: { ...prev[callId]?.[key], ...update } } }));
	}, []);

	const getOverrides = useCallback((callId: string) => overrides[callId] ?? {}, [overrides]);

	useEffect(() => {
		if (sessionState !== 'calling' && sessionState !== 'ringing' && sessionState !== 'ongoing') {
			setOverrides({});
		}
	}, [sessionState]);

	const value = useMemo(() => ({ getOverrides, setOverride }), [getOverrides, setOverride]);

	return <AppActionOverridesContext.Provider value={value}>{children}</AppActionOverridesContext.Provider>;
};

export default AppActionOverridesProvider;

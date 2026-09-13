import { useCallback, useEffect, useState, type ReactNode } from 'react';

import { usePeekMediaSessionState } from '../../../context';
import AppActionOverridesContext from '../context/AppActionOverridesContext';
import type { AppActionUpdate, MediaCallAppAction } from '../context/MediaCallAppActionsContext';

const AppActionOverridesProvider = ({ children }: { children: ReactNode }) => {
	const [overrides, setOverrides] = useState<Record<MediaCallAppAction['key'], AppActionUpdate>>({});
	const sessionState = usePeekMediaSessionState();

	const setOverride = useCallback((key: MediaCallAppAction['key'], update: AppActionUpdate) => {
		setOverrides((prev) => ({ ...prev, [key]: { ...prev[key], ...update } }));
	}, []);

	useEffect(() => {
		if (sessionState !== 'calling' && sessionState !== 'ringing' && sessionState !== 'ongoing') {
			setOverrides({});
		}
	}, [sessionState]);

	return <AppActionOverridesContext.Provider value={{ overrides, setOverride }}>{children}</AppActionOverridesContext.Provider>;
};

export default AppActionOverridesProvider;

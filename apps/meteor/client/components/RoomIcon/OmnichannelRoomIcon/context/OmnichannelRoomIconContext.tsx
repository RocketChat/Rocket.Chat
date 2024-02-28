import { createContext, useMemo, useContext } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import type { AsyncState } from '../../../../lib/asyncState/AsyncState';
import { AsyncStatePhase } from '../../../../lib/asyncState/AsyncStatePhase';

type IOmnichannelRoomIconContext = {
	queryIcon(app: string, icon: string): [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => AsyncState<string>];
};

export const OmnichannelRoomIconContext = createContext<IOmnichannelRoomIconContext>({
	queryIcon: () => [
		(): (() => void) => (): void => undefined,
		(): AsyncState<string> => ({
			phase: AsyncStatePhase.LOADING,
			value: undefined,
			error: undefined,
		}),
	],
});

export const useOmnichannelRoomIcon = (app: string, icon: string): AsyncState<string> => {
	const { queryIcon } = useContext(OmnichannelRoomIconContext);
	const [subscribe, getSnapshot] = useMemo(() => queryIcon(app, icon), [app, queryIcon, icon]);
	return useSyncExternalStore(subscribe, getSnapshot);
};

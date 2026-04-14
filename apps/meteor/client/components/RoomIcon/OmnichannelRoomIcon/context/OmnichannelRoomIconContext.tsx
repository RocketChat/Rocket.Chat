import { createContext, useMemo, useContext, useSyncExternalStore } from 'react';

type IOmnichannelRoomIconContext = {
	queryIcon(app: string, icon: string): [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => string | undefined];
};

export const OmnichannelRoomIconContext = createContext<IOmnichannelRoomIconContext>({
	queryIcon: () => [(): (() => void) => (): void => undefined, () => undefined],
});

export const useOmnichannelRoomIcon = (app: string, icon: string): string | undefined => {
	const { queryIcon } = useContext(OmnichannelRoomIconContext);
	const [subscribe, getSnapshot] = useMemo(() => queryIcon(app, icon), [app, queryIcon, icon]);
	return useSyncExternalStore(subscribe, getSnapshot);
};

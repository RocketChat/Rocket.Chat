import { createContext, useMemo, useContext } from 'react';
import { useSubscription, Unsubscribe } from 'use-subscription';

import { AsyncState } from '../../../../lib/asyncState/AsyncState';
import { AsyncStatePhase } from '../../../../lib/asyncState/AsyncStatePhase';

type IOmnichannelRoomIconContext = {
	queryIcon(
		app: string,
		icon: string,
	): {
		getCurrentValue: () => AsyncState<string>;
		subscribe: (callback: () => void) => Unsubscribe;
	};
};

export const OmnichannelRoomIconContext = createContext<IOmnichannelRoomIconContext>({
	queryIcon: () => ({
		getCurrentValue: (): AsyncState<string> => ({
			phase: AsyncStatePhase.LOADING,
			value: undefined,
			error: undefined,
		}),
		subscribe: (): Unsubscribe => (): void => undefined,
	}),
});

export const useOmnichannelRoomIcon = (app: string, icon: string): AsyncState<string> => {
	const { queryIcon } = useContext(OmnichannelRoomIconContext);
	return useSubscription(useMemo(() => queryIcon(app, icon), [app, queryIcon, icon]));
};

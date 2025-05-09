import type { UserPresenceContextValue } from '@rocket.chat/ui-contexts';
import { useSetting, UserPresenceContext } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import { useMemo, useEffect } from 'react';

import { Presence } from '../lib/presence';

type UserPresenceProviderProps = {
	children?: ReactNode;
};

const UserPresenceProvider = ({ children }: UserPresenceProviderProps): ReactElement => {
	const usePresenceDisabled = useSetting('Presence_broadcast_disabled', false);

	useEffect(() => {
		Presence.setStatus(usePresenceDisabled ? 'disabled' : 'enabled');
	}, [usePresenceDisabled]);

	const contextValue: UserPresenceContextValue = useMemo(
		() => ({
			queryUserData: (uid) => {
				if (!uid) {
					return { get: () => undefined, subscribe: () => () => undefined };
				}

				const subscribe = (callback: () => void) => {
					Presence.listen(uid, callback);

					return () => {
						Presence.stop(uid, callback);
					};
				};

				const get = () => Presence.store.get(uid);

				return { subscribe, get };
			},
		}),
		[],
	);

	return <UserPresenceContext.Provider value={contextValue}>{children}</UserPresenceContext.Provider>;
};

export default UserPresenceProvider;

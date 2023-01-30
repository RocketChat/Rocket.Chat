import type { ReactElement, ReactNode } from 'react';
import React, { useMemo } from 'react';

import { UserPresenceContext } from '../contexts/UserPresenceContext';
import { Presence } from '../lib/presence';

type UserPresenceProviderProps = {
	children?: ReactNode;
};

const UserPresenceProvider = ({ children }: UserPresenceProviderProps): ReactElement => {
	return (
		<UserPresenceContext.Provider
			value={useMemo(
				() => ({
					queryUserData: (uid) => {
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
			)}
		>
			{children}
		</UserPresenceContext.Provider>
	);
};

export default UserPresenceProvider;

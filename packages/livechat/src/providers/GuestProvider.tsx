// import { UserContext } from '@rocket.chat/ui-contexts';
// import type { ContextType, ReactElement, ReactNode } from 'react';
// import React, { useCallback, useMemo } from 'react';
// import { useSyncExternalStore } from 'use-sync-external-store/shim';

// import { useSDK } from './SDKProvider';

// export type LoginMethods = keyof typeof Meteor;

// type GuestProviderProps = {
// 	children: ReactNode;
// };

// const GuestProvider = ({ children }: GuestProviderProps): ReactElement => {
// 	const sdk = useSDK();

// 	const user = useSyncExternalStore(
// 		(cb) => sdk.account.on('user', () => cb()),
// 		() => sdk.account.user,
// 	);

// 	console.log('user', user);

// 	const logout = useCallback(
// 		(): Promise<void> =>
// 			new Promise((resolve, reject) => {
// 				if (!user) {
// 					return resolve();
// 				}

// 				sdk.account.logout().then(resolve, reject);
// 				sdk.call('logoutCleanUp', user).then(resolve, reject);
// 			}),
// 		[user, sdk],
// 	);

// 	const contextValue = useMemo(
// 		(): ContextType<typeof UserContext> => ({
// 			userId: user?.id ?? null,
// 			user,
// 			logout,

// 			loginWithToken: async (token: string): Promise<void> => {
// 				await sdk.account.loginWithToken(token);
// 			},
// 		}),
// 		[user, logout, sdk],
// 	);

// 	return <UserContext.Provider children={children} value={contextValue} />;
// };

// export default GuestProvider;

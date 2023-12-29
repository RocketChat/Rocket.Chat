import { UserContext } from '@rocket.chat/ui-contexts';
import type { ContextType, ReactElement, ReactNode } from 'react';
import React, { useCallback, useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { useSDK } from './SDKProvider';

export type LoginMethods = keyof typeof Meteor;

type UserProviderProps = {
	children: ReactNode;
};

// This is a simple implementation of a hashing function using the SubtleCrypto API
// We advise you do your own research on how to hash passwords securely
async function hashPassword(password: string): Promise<string> {
	// Step 1: Convert the input string to a Uint8Array
	const encoder = new TextEncoder();
	const data = encoder.encode(password);

	// Step 2: Use the SubtleCrypto API to create a hash
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);

	// Step 3: Convert the hash buffer to a hex string
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');

	// Step 4: Return the hashed string
	return hashHex;
}

const UserProvider = ({ children }: UserProviderProps): ReactElement => {
	const sdk = useSDK();

	const user = useSyncExternalStore(
		(cb) => sdk.account.on('user', () => cb()),
		() => sdk.account.user,
	);

	console.log('user', user);

	const logout = useCallback(
		(): Promise<void> =>
			new Promise((resolve, reject) => {
				if (!user) {
					return resolve();
				}

				sdk.account.logout().then(resolve, reject);
				sdk.call('logoutCleanUp', user).then(resolve, reject);
			}),
		[user, sdk],
	);

	const contextValue = useMemo(
		(): ContextType<typeof UserContext> => ({
			userId: user?.id ?? null,
			user,
			logout,

			loginWithToken: async (token: string): Promise<void> => {
				await sdk.account.loginWithToken(token);
			},

			loginWithPassword: async (
				user: string | { username: string } | { email: string } | { id: string },
				password: string,
			): Promise<void> => sdk.account.loginWithPassword(user, await hashPassword(password)),
		}),
		[user, logout, sdk],
	);

	return <UserContext.Provider children={children} value={contextValue} />;
};

export default UserProvider;

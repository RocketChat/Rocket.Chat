import { Accounts } from 'meteor/accounts-base';
import { useEffect } from 'react';
import { useQuery, UseQueryResult } from 'react-query';

import { useUserId } from '../../../contexts/UserContext';
import * as operations from '../../../lib/e2ee/operations';
import { useFetchUserKeysEffects } from './useFetchUserKeysEffects';

export const useUserKeys = ({ enabled = true }: { enabled?: boolean } = {}): UseQueryResult<CryptoKeyPair, Error> => {
	const { onDecryptingRemoteKeyPair, onFailureToDecrypt, onGenerateRandomPassword, onPromptingForPassword } = useFetchUserKeysEffects();
	const uid = useUserId();

	useEffect(() => {
		const { stop } = Accounts.onLogout(() => {
			operations.forgetKeys();
		}) as unknown as { stop: () => void };

		return (): void => {
			stop();
		};
	}, []);

	return useQuery<CryptoKeyPair, Error>(
		['e2ee', 'userKeys', { uid, enabled }],
		({ signal }) => {
			if (!uid) {
				throw new Error('missing user ID');
			}

			return operations.fetchKeys({
				signal,
				uid,
				onDecryptingRemoteKeyPair,
				onPromptingForPassword,
				onFailureToDecrypt,
				onGenerateRandomPassword,
			});
		},
		{
			staleTime: Infinity,
			cacheTime: 0,
			refetchOnMount: 'always',
			enabled,
		},
	);
};

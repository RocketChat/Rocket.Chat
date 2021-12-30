import { useQuery, UseQueryResult } from 'react-query';

import { e2ee } from '../../../../app/e2e/client';
import { useUserId } from '../../../contexts/UserContext';
import { fetchUserKeyPair } from '../../../lib/e2ee/fetchUserKeyPair';
import { useFetchUserKeysEffects } from './useFetchUserKeysEffects';

export const useUserKeys = ({ enabled = true }: { enabled?: boolean } = {}): UseQueryResult<CryptoKeyPair, Error> => {
	const { onDecryptingRemoteKeyPair, onFailureToDecrypt, onGenerateRandomPassword, onPromptingForPassword } = useFetchUserKeysEffects();
	const uid = useUserId();

	return useQuery<CryptoKeyPair, Error>(
		['e2ee', 'userKeys', { uid, enabled }],
		({ signal }) => {
			if (!uid) {
				throw new Error('missing user ID');
			}

			return fetchUserKeyPair({
				uid,
				onDecryptingRemoteKeyPair,
				onPromptingForPassword,
				onFailureToDecrypt,
				onGenerateRandomPassword,
				signal,
			});
		},
		{
			staleTime: Infinity,
			cacheTime: 0,
			refetchOnMount: 'always',
			onSuccess: (data) => {
				e2ee.use(data);
			},
			onError: (error) => {
				console.error(error);
			},
			enabled,
		},
	);
};

import { useContext } from 'react';
import { useMutation, UseMutationResult } from 'react-query';

import { useUserId } from '../../contexts/UserContext';
import * as operations from '../../lib/e2ee/operations';
import { E2EEContext } from './E2EEContext';

export const useChangeE2EEPasswordMutation = (): UseMutationResult<void, Error, string> => {
	const { keyPair } = useContext(E2EEContext);

	const uid = useUserId();

	return useMutation(['e2ee', 'changePassword'], async (password: string) => {
		if (!uid) {
			throw new Error('invalid user');
		}

		if (!keyPair) {
			throw new Error('E2EE is not active');
		}

		await operations.changePassword({ keyPair, uid, password });
	});
};

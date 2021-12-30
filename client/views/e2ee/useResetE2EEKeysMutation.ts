import { useMutation, UseMutationResult } from 'react-query';

import * as operations from '../../lib/e2ee/operations';

export const useResetE2EEKeysMutation = (): UseMutationResult<void, Error> =>
	useMutation(['e2ee', 'resetKeys'], async () => {
		await operations.resetKeys();
	});

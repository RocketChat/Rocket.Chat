import { useCallback } from 'react';

import { FromApi } from '../../definition/FromApi';
import { useEndpoint } from '../contexts/ServerContext';
import { Method, Params, PathFor, Return } from '../contexts/ServerContext/endpoints';
import { useToastMessageDispatch } from '../contexts/ToastMessagesContext';

export const useEndpointActionExperimental = <M extends Method, P extends PathFor<M>>(
	method: M,
	path: P,
	successMessage?: string,
): ((params: Params<M, P>[0], extraParams?: Params<M, P>[1]) => Promise<FromApi<Return<M, P>>>) => {
	const sendData = useEndpoint(method, path);
	const dispatchToastMessage = useToastMessageDispatch();

	return useCallback(
		async (params, extraParams?) => {
			try {
				const data = await sendData(params, extraParams);

				if (successMessage) {
					dispatchToastMessage({ type: 'success', message: successMessage });
				}

				return data;
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
				// return { success: false };
				throw error;
			}
		},
		[dispatchToastMessage, sendData, successMessage],
	);
};

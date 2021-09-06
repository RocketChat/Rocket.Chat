import { useCallback } from 'react';

import { FromApi } from '../../definition/FromApi';
import { useEndpoint } from '../contexts/ServerContext';
import { Method, Params, PathFor, Return } from '../contexts/ServerContext/endpoints';
import { useToastMessageDispatch } from '../contexts/ToastMessagesContext';

export const useEndpointAction = <M extends Method, P extends PathFor<M>>(
	method: M,
	path: P,
	params: Params<M, P>[0] = {},
	successMessage?: string,
): ((extraParams?: Params<M, P>[1]) => Promise<FromApi<Return<M, P>>>) => {
	const sendData = useEndpoint(method, path);
	const dispatchToastMessage = useToastMessageDispatch();

	return useCallback(
		async (extraParams?) => {
			try {
				const data = await sendData(params, extraParams);

				if (successMessage) {
					dispatchToastMessage({ type: 'success', message: successMessage });
				}

				return data;
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
				throw error;
			}
		},
		[dispatchToastMessage, params, sendData, successMessage],
	);
};

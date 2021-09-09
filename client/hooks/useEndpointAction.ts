import { useCallback } from 'react';

import { Serialized } from '../../definition/Serialized';
import { useEndpoint } from '../contexts/ServerContext';
import { Method, Params, PathFor, Return } from '../contexts/ServerContext/endpoints';
import { useToastMessageDispatch } from '../contexts/ToastMessagesContext';

export const useEndpointAction = <M extends Method, P extends PathFor<M>>(
	method: M,
	path: P,
	params: Params<M, P>[0] = {},
	successMessage?: string,
): ((extraParams?: Params<M, P>[1]) => Promise<Serialized<Return<M, P>>>) => {
	const sendData = useEndpoint(method, path);
	const dispatchToastMessage = useToastMessageDispatch();

	return useCallback(async () => {
		try {
			const data = await sendData(params);

			if (successMessage) {
				dispatchToastMessage({ type: 'success', message: successMessage });
			}

			return data;
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			throw error;
		}
	}, [dispatchToastMessage, params, sendData, successMessage]);
};

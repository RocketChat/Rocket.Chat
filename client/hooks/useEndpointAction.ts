import { useCallback } from 'react';

import { Serialized } from '../../definition/Serialized';
import { Method, Params, PathFor, Return } from '../../definition/rest';
import { useEndpoint } from '../contexts/ServerContext';
import { useToastMessageDispatch } from '../contexts/ToastMessagesContext';

export const useEndpointAction = <TMethod extends Method, TPath extends PathFor<TMethod>>(
	method: TMethod,
	path: TPath,
	params: Serialized<Params<TMethod, TPath>[0]> = {} as Serialized<Params<TMethod, TPath>[0]>,
	successMessage?: string,
): ((extraParams?: Params<TMethod, TPath>[1]) => Promise<Serialized<Return<TMethod, TPath>>>) => {
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

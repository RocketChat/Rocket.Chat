import { useCallback } from 'react';

import { Serialized } from '../../definition/Serialized';
import { Method, Params, PathFor, Return } from '../../definition/rest';
import { useEndpoint } from '../contexts/ServerContext';
import { useToastMessageDispatch } from '../contexts/ToastMessagesContext';

export const useEndpointActionExperimental = <
	TMethod extends Method,
	TPath extends PathFor<TMethod>,
>(
	method: TMethod,
	path: TPath,
	successMessage?: string,
): ((
	params: Serialized<Params<TMethod, TPath>[0]>,
) => Promise<Serialized<Return<TMethod, TPath>>>) => {
	const sendData = useEndpoint(method, path);
	const dispatchToastMessage = useToastMessageDispatch();

	return useCallback(
		async (params) => {
			try {
				const data = await sendData(params);

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

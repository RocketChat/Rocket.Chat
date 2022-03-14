import { useCallback } from 'react';

import { Serialized } from '../../definition/Serialized';
import { MatchPathPattern, Method, OperationParams, OperationResult, PathFor } from '../../definition/rest';
import { useEndpoint } from '../contexts/ServerContext';
import { useToastMessageDispatch } from '../contexts/ToastMessagesContext';

export const useEndpointActionExperimental = <TMethod extends Method, TPath extends PathFor<TMethod>>(
	method: TMethod,
	path: TPath,
	successMessage?: string,
): ((
	params: Serialized<OperationParams<TMethod, MatchPathPattern<TPath>>>,
) => Promise<Serialized<OperationResult<TMethod, MatchPathPattern<TPath>>>>) => {
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
				dispatchToastMessage({ type: 'error', message: String(error) });
				// return { success: false };
				throw error;
			}
		},
		[dispatchToastMessage, sendData, successMessage],
	);
};

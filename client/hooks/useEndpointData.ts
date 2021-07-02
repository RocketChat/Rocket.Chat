import { useCallback, useEffect } from 'react';

import {
	ServerEndpointPath,
	ServerEndpointRequestPayload,
	ServerEndpointResponsePayload,
	ServerEndpoints,
	useEndpoint,
} from '../contexts/ServerContext';
import { useToastMessageDispatch } from '../contexts/ToastMessagesContext';
import { AsyncState, useAsyncState } from './useAsyncState';

const defaultParams = {};

type ServerGetEndpointPaths = {
	[K in ServerEndpointPath]: ServerEndpoints[K] extends { GET: any } ? K : never;
};

export const useEndpointData = <
	_T,
	Path extends ServerGetEndpointPaths[keyof ServerGetEndpointPaths],
>(
	endpoint: Path,
	params: ServerEndpointRequestPayload<'GET', Path> = defaultParams,
	initialValue?:
		| ServerEndpointResponsePayload<'GET', Path>
		| (() => ServerEndpointResponsePayload<'GET', Path>),
): AsyncState<ServerEndpointResponsePayload<'GET', Path>> & { reload: () => void } => {
	const { resolve, reject, reset, ...state } =
		useAsyncState<ServerEndpointResponsePayload<'GET', Path>>(initialValue);
	const dispatchToastMessage = useToastMessageDispatch();
	const getData = useEndpoint('GET', endpoint);

	const fetchData = useCallback(() => {
		reset();
		getData(params)
			.then(resolve)
			.catch((error) => {
				console.error(error);
				dispatchToastMessage({
					type: 'error',
					message: error,
				});
				reject(error);
			});
	}, [reset, getData, params, resolve, dispatchToastMessage, reject]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	return {
		...state,
		reload: fetchData,
	};
};

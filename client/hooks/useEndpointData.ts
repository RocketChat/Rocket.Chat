import { useCallback, useEffect } from 'react';

import { useEndpoint } from '../contexts/ServerContext';
import { useToastMessageDispatch } from '../contexts/ToastMessagesContext';
import { AsyncState, useAsyncState } from './useAsyncState';

const defaultParams = {};

export const useEndpointData = <T>(
	endpoint: string,
	params: Record<string, unknown> = defaultParams,
	initialValue?: T | (() => T),
	noOfRoomsDeleted?: number
): AsyncState<T> & { reload: () => void } => {
	const { resolve, reject, reset, ...state } = useAsyncState<T>(initialValue);
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
	}, [fetchData, noOfRoomsDeleted]);

	return {
		...state,
		reload: fetchData,
	};
};

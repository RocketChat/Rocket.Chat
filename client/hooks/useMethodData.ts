import { useCallback, useEffect } from 'react';

import { ServerMethods, useMethod } from '../contexts/ServerContext';
import { useToastMessageDispatch } from '../contexts/ToastMessagesContext';
import { AsyncState, useAsyncState } from './useAsyncState';

const defaultArgs: unknown[] = [];

export const useMethodData = <T>(
	methodName: keyof ServerMethods,
	args: any[] = defaultArgs,
	initialValue?: T | (() => T),
): AsyncState<T> & { reload: () => void } => {
	const { resolve, reject, reset, ...state } = useAsyncState<T>(initialValue);
	const dispatchToastMessage = useToastMessageDispatch();
	const getData: (...args: unknown[]) => Promise<T> = useMethod(methodName);

	const fetchData = useCallback(() => {
		reset();
		getData(...args)
			.then(resolve)
			.catch((error) => {
				console.error(error);
				dispatchToastMessage({
					type: 'error',
					message: error,
				});
				reject(error);
			});
	}, [reset, getData, args, resolve, dispatchToastMessage, reject]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	return {
		...state,
		reload: fetchData,
	};
};

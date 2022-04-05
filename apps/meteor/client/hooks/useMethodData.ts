import { useCallback, useEffect } from 'react';

import type { Awaited } from '../../definition/utils';
import { ServerMethodFunction, ServerMethodParameters, ServerMethods, useMethod } from '../contexts/ServerContext';
import { useToastMessageDispatch } from '../contexts/ToastMessagesContext';
import { AsyncState, useAsyncState } from './useAsyncState';

export const useMethodData = <MethodName extends keyof ServerMethods, Result = Awaited<ReturnType<ServerMethodFunction<MethodName>>>>(
	methodName: MethodName,
	args: ServerMethodParameters<MethodName>,
	initialValue?: Result | (() => Result),
): AsyncState<Result> & { reload: () => void } => {
	const { resolve, reject, reset, ...state } = useAsyncState<Result>(initialValue);
	const dispatchToastMessage = useToastMessageDispatch();
	const getData: ServerMethodFunction<MethodName> = useMethod(methodName);

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
		console.log('as');
		fetchData();
	}, [fetchData]);

	return {
		...state,
		reload: fetchData,
	};
};

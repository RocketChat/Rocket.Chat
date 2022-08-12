import { Serialized } from '@rocket.chat/core-typings';
import type { MatchPathPattern, OperationParams, OperationResult, PathFor } from '@rocket.chat/rest-typings';
import { useToastMessageDispatch, useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect } from 'react';

import { getConfig } from '../lib/utils/getConfig';
import { AsyncState, useAsyncState } from './useAsyncState';

const log = (name: string): Console['log'] =>
	process.env.NODE_ENV !== 'production' || getConfig('debug') === 'true'
		? (...args): void => console.log(name, ...args)
		: (): void => undefined;

const deprecationWarning = log('useEndpointData is deprecated, use @tanstack/react-query instead');

/**
 * use @tanstack/react-query with useEndpoint instead
 * @deprecated
 */

export const useEndpointData = <TPath extends PathFor<'GET'>>(
	endpoint: TPath,
	params?: OperationParams<'GET', MatchPathPattern<TPath>>,
	initialValue?:
		| Serialized<OperationResult<'GET', MatchPathPattern<TPath>>>
		| (() => Serialized<OperationResult<'GET', MatchPathPattern<TPath>>>),
): AsyncState<Serialized<OperationResult<'GET', MatchPathPattern<TPath>>>> & {
	reload: () => void;
} => {
	deprecationWarning({ endpoint, params, initialValue });
	const { resolve, reject, reset, ...state } = useAsyncState(initialValue);
	const dispatchToastMessage = useToastMessageDispatch();
	const getData = useEndpoint('GET', endpoint);

	const fetchData = useCallback(() => {
		reset();
		getData(params as any)
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

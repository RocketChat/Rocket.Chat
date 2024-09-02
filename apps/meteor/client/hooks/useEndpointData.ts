import type { Serialized } from '@rocket.chat/core-typings';
import type { OperationParams, OperationResult, PathPattern, UrlParams } from '@rocket.chat/rest-typings';
import { useToastMessageDispatch, useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect } from 'react';

import { getConfig } from '../lib/utils/getConfig';
import type { AsyncState } from './useAsyncState';
import { useAsyncState } from './useAsyncState';

const log = (name: string): Console['log'] =>
	process.env.NODE_ENV !== 'production' || getConfig('debug') === 'true'
		? (...args): void => console.warn(name, ...args)
		: (): void => undefined;

const deprecationWarning = log('useEndpointData is deprecated, use @tanstack/react-query instead');

/**
 * use @tanstack/react-query with useEndpoint instead
 * @deprecated
 */
export const useEndpointData = <TPathPattern extends PathPattern>(
	endpoint: TPathPattern,
	options: NoInfer<{
		keys?: UrlParams<TPathPattern>;
		params?: OperationParams<'GET', TPathPattern>;
		initialValue?: Serialized<OperationResult<'GET', TPathPattern>> | (() => Serialized<OperationResult<'GET', TPathPattern>>);
	}> = {},
): AsyncState<Serialized<OperationResult<'GET', TPathPattern>>> & {
	reload: () => void;
} => {
	deprecationWarning({ endpoint, ...options });
	const { resolve, reject, reset, ...state } = useAsyncState(options.initialValue);
	const dispatchToastMessage = useToastMessageDispatch();
	const getData = useEndpoint('GET', endpoint, options.keys as UrlParams<TPathPattern>);

	const fetchData = useCallback(() => {
		reset();
		getData(options.params as OperationParams<'GET', TPathPattern>)
			.then(resolve)
			.catch((error) => {
				console.error(error);
				dispatchToastMessage({
					type: 'error',
					message: error,
				});
				reject(error);
			});
	}, [reset, getData, options.params, resolve, dispatchToastMessage, reject]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	return {
		...state,
		reload: fetchData,
	};
};

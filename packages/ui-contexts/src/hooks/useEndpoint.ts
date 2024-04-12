import type { Serialized } from '@rocket.chat/core-typings';
import type { Method, OperationParams, OperationResult, PathPattern, UrlParams } from '@rocket.chat/rest-typings';
import { useCallback, useContext, useRef } from 'react';

import { ServerContext } from '../ServerContext';

export type EndpointFunction<TMethod extends Method, TPathPattern extends PathPattern> = undefined extends OperationParams<
	TMethod,
	TPathPattern
>
	? (params?: OperationParams<TMethod, TPathPattern>) => Promise<Serialized<OperationResult<TMethod, TPathPattern>>>
	: (params: OperationParams<TMethod, TPathPattern>) => Promise<Serialized<OperationResult<TMethod, TPathPattern>>>;

export function useEndpoint<TMethod extends Method, TPathPattern extends PathPattern>(
	method: TMethod,
	pathPattern: TPathPattern,
	...[keys]: undefined extends UrlParams<TPathPattern> ? [keys?: UrlParams<TPathPattern>] : [keys: UrlParams<TPathPattern>]
): EndpointFunction<TMethod, TPathPattern> {
	const { callEndpoint } = useContext(ServerContext);
	const keysRef = useRef(keys);
	keysRef.current = keys;

	return useCallback(
		(params: OperationParams<TMethod, TPathPattern> | undefined) =>
			callEndpoint({
				method,
				pathPattern,
				keys: keysRef.current as UrlParams<TPathPattern>,
				params: params as OperationParams<TMethod, TPathPattern>,
			}),
		[callEndpoint, pathPattern, method],
	);
}

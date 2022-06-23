import type { Serialized } from '@rocket.chat/core-typings';
import type { Method, PathFor, OperationParams, MatchPathPattern, OperationResult, PathPattern } from '@rocket.chat/rest-typings';
import { useCallback, useContext } from 'react';

import { ServerContext } from '../ServerContext';

export type EndpointFunction<TMethod extends Method, TPathPattern extends PathPattern> = (
	params: void extends OperationParams<TMethod, TPathPattern> ? void : Serialized<OperationParams<TMethod, TPathPattern>>,
) => Promise<Serialized<OperationResult<TMethod, TPathPattern>>>;

export const useEndpoint = <TMethod extends Method, TPath extends PathFor<TMethod>>(
	method: TMethod,
	path: TPath,
): EndpointFunction<TMethod, MatchPathPattern<TPath>> => {
	const { callEndpoint } = useContext(ServerContext);

	return useCallback(
		(params: Serialized<OperationParams<TMethod, MatchPathPattern<TPath>>>) => callEndpoint(method, path, params),
		[callEndpoint, path, method],
	);
};

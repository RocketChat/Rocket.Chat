import type { ServerMethods } from '@rocket.chat/ddp-client';
import { useCallback, useContext } from 'react';

import { ServerContext } from '../ServerContext';

/* @deprecated prefer the use of api endpoints (useEndpoint) */
export const useMethod = <T extends keyof ServerMethods>(
	methodName: T,
): ((...args: Parameters<ServerMethods[T]>) => Promise<ReturnType<ServerMethods[T]>>) => {
	const { callMethod } = useContext(ServerContext);

	return useCallback(
		(...args) => {
			if (!callMethod) {
				throw new Error(`cannot use useMethod(${methodName}) hook without a wrapping ServerContext`);
			}

			return callMethod(methodName, ...args);
		},
		[callMethod, methodName],
	);
};

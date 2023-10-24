import type { ServerMethodFunction, ServerMethodParameters, ServerMethods } from '@rocket.chat/ddp-client/src/types/methods';
import { useCallback, useContext } from 'react';

import { ServerContext } from '../ServerContext';

export const useMethod = <MethodName extends keyof ServerMethods>(methodName: MethodName): ServerMethodFunction<MethodName> => {
	const { callMethod } = useContext(ServerContext);

	return useCallback(
		(...args: ServerMethodParameters<MethodName>) => {
			if (!callMethod) {
				throw new Error(`cannot use useMethod(${methodName}) hook without a wrapping ServerContext`);
			}

			return callMethod(methodName, ...args);
		},
		[callMethod, methodName],
	);
};

import { useCallback, useContext } from 'react';

import { ServerContext } from '../ServerContext';
import type { ServerMethodFunction, ServerMethodParameters, ServerMethods } from '../ServerContext/methods';

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

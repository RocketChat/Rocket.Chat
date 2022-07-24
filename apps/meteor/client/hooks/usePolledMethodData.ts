import { Awaited } from '@rocket.chat/core-typings';
import { ServerMethodFunction, ServerMethodParameters, ServerMethods } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { AsyncState } from './useAsyncState';
import { useMethodData } from './useMethodData';

export const usePolledMethodData = <MethodName extends keyof ServerMethods, Result = Awaited<ReturnType<ServerMethodFunction<MethodName>>>>(
	methodName: keyof ServerMethods,
	args: ServerMethodParameters<MethodName>,
	intervalMs: number,
): AsyncState<Result> & { reload: () => void } => {
	const { reload, ...state } = useMethodData(methodName, args);

	useEffect(() => {
		const timer = setInterval(() => {
			reload();
		}, intervalMs);

		return (): void => {
			clearInterval(timer);
		};
	}, [reload, intervalMs]);

	return {
		...state,
		reload,
	};
};

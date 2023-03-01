import type { Method, OperationParams, PathPattern, UrlParams } from '@rocket.chat/rest-typings';
import type { EndpointFunction } from '@rocket.chat/ui-contexts';
import { useToastMessageDispatch, useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

type UseEndpointActionOptions<TPathPattern extends PathPattern> = (undefined extends UrlParams<TPathPattern>
	? {
			keys?: UrlParams<TPathPattern>;
	  }
	: {
			keys: UrlParams<TPathPattern>;
	  }) & {
	successMessage?: string;
};
export function useEndpointAction<TMethod extends Method, TPathPattern extends PathPattern>(
	method: TMethod,
	pathPattern: TPathPattern,
	options: UseEndpointActionOptions<TPathPattern> = { keys: {} as UrlParams<TPathPattern> },
): EndpointFunction<TMethod, TPathPattern> {
	const sendData = useEndpoint(method, pathPattern, options.keys as UrlParams<TPathPattern>);

	const dispatchToastMessage = useToastMessageDispatch();

	return useCallback(
		async (params: OperationParams<TMethod, TPathPattern> | undefined) => {
			try {
				const data = await sendData(params as OperationParams<TMethod, TPathPattern>);

				if (options.successMessage) {
					dispatchToastMessage({ type: 'success', message: options.successMessage });
				}

				return data;
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
				throw error;
			}
		},
		[dispatchToastMessage, sendData, options.successMessage],
	);
}

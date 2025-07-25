import type { Serialized } from '@rocket.chat/core-typings';
import type { Method, OperationParams, OperationResult, PathPattern, UrlParams } from '@rocket.chat/rest-typings';
import { useToastMessageDispatch, useEndpoint } from '@rocket.chat/ui-contexts';
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';

type UseEndpointActionOptions<TMethod extends Method, TPathPattern extends PathPattern> = (undefined extends UrlParams<TPathPattern>
	? {
			keys?: UrlParams<TPathPattern>;
		}
	: {
			keys: UrlParams<TPathPattern>;
		}) &
	Omit<
		UseMutationOptions<
			Serialized<OperationResult<TMethod, TPathPattern>>,
			Error,
			undefined extends OperationParams<TMethod, TPathPattern> ? void : OperationParams<TMethod, TPathPattern>
		>,
		'mutationFn'
	>;

export function useEndpointMutation<TMethod extends Method, TPathPattern extends PathPattern>(
	method: TMethod,
	pathPattern: TPathPattern,
	{ keys, ...options }: NoInfer<UseEndpointActionOptions<TMethod, TPathPattern>> = { keys: {} as UrlParams<TPathPattern> },
) {
	const sendData = useEndpoint(method, pathPattern, keys as UrlParams<TPathPattern>);

	const dispatchToastMessage = useToastMessageDispatch();

	return useMutation({
		mutationFn: sendData,
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		...options,
	}) as UseMutationResult<
		Serialized<OperationResult<TMethod, TPathPattern>>,
		Error,
		undefined extends OperationParams<TMethod, TPathPattern> ? void : OperationParams<TMethod, TPathPattern>
	>;
}

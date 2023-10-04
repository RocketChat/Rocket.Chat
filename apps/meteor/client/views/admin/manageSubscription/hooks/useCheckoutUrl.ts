import type { OperationResult } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

const DEFAULT_URL = 'https://go.rocket.chat/i/contact-sales';

export const useCheckoutUrl = (): { isLoading: boolean; isError: boolean; url: string } => {
	const getCheckoutUrl = useEndpoint('GET', '/v1/billing.checkoutUrl');

	const { data, isLoading, isError }: UseQueryResult<OperationResult<'GET', '/v1/billing.checkoutUrl'>> = useQuery(
		['billing', 'checkoutUrl'],
		() => getCheckoutUrl(),
		{
			staleTime: Infinity,
			keepPreviousData: true,
		},
	);

	const url = data?.url || DEFAULT_URL;

	return { isLoading, isError, url };
};

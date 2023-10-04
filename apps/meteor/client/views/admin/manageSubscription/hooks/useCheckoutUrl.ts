import type { OperationResult } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { CONTACT_SALES_LINK } from '../utils/links';

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

	const url = data?.url || CONTACT_SALES_LINK;

	return { isLoading, isError, url };
};

import { useAbsoluteUrl, useEndpoint } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';

import { useExternalLink } from '../../../../hooks/useExternalLink';
import { CONTACT_SALES_LINK } from '../utils/links';

export const useCheckoutUrlAction = () => {
	const getCheckoutUrl = useEndpoint('GET', '/v1/cloud.checkoutUrl');
	const handleExternalLink = useExternalLink();

	return useMutation({
		mutationFn: async (extraData?: Record<string, string>) => {
			const { url } = await getCheckoutUrl();

			const extraUrlParams = new URL(url);

			if (extraData) {
				Object.entries(extraData).forEach(([key, value]) => {
					extraUrlParams.searchParams.append(key, value.toString());
				});
			}

			handleExternalLink(extraUrlParams.toString());
		},
		onError: (_e, extraData) => {
			const extraUrlParams = new URL(CONTACT_SALES_LINK);

			if (extraData) {
				Object.entries(extraData).forEach(([key, value]) => {
					extraUrlParams.searchParams.append(key, value.toString());
				});
			}

			handleExternalLink(extraUrlParams.toString());
		},
	});
};

export const useCheckoutUrl = () => {
	const absoluteUrl = useAbsoluteUrl()('/links/manage-subscription');

	return (query?: Record<string, string>) => {
		const url = new URL(absoluteUrl);
		if (query) {
			Object.entries(query).forEach(([key, value]) => {
				url.searchParams.append(key, value.toString());
			});
		}
		return url.toString();
	};
};

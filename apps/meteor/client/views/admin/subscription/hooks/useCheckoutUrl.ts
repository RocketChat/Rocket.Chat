import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';

import { useExternalLink } from '../../../../hooks/useExternalLink';
import { CONTACT_SALES_LINK } from '../utils/links';

export const useCheckoutUrlAction = () => {
	const getCheckoutUrl = useEndpoint('GET', '/v1/cloud.checkoutUrl');
	const handleExternalLink = useExternalLink();

	return useMutation({
		mutationFn: async () => {
			const { url } = await getCheckoutUrl();
			handleExternalLink(url);
		},
		onError: () => {
			handleExternalLink(CONTACT_SALES_LINK);
		},
	});
};

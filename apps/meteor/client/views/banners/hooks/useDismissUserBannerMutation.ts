import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';

export const useDismissUserBannerMutation = () => {
	const dismissBanner = useEndpoint('POST', '/v1/banners.dismiss');

	const dispatchToastMessage = useToastMessageDispatch();

	return useMutation({
		mutationFn: (bannerId: string) => dismissBanner({ bannerId }),
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});
};

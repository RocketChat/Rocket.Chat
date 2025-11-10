import { useRouter, useUserPreference } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

export const useOmnichannelCloseRoute = () => {
	const hideConversationAfterClosing = useUserPreference<boolean>('omnichannelHideConversationAfterClosing') ?? true;
	const router = useRouter();

	const navigateHome = useCallback(() => {
		if (!hideConversationAfterClosing) {
			return;
		}

		const routeName = router.getRouteName();

		if (routeName === 'omnichannel-current-chats') {
			router.navigate({ name: 'omnichannel-current-chats' });
		} else {
			router.navigate({ name: 'home' });
		}
	}, [hideConversationAfterClosing, router]);

	return { navigateHome };
};

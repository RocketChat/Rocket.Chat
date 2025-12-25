import { useRouter, useUserPreference } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import { useOmnichannelDirectoryRouter } from '../directory/hooks/useOmnichannelDirectoryRouter';

export const useOmnichannelCloseRoute = () => {
	const hideConversationAfterClosing = useUserPreference<boolean>('omnichannelHideConversationAfterClosing') ?? true;
	const router = useRouter();
	const omnichannelDirectoryRouter = useOmnichannelDirectoryRouter();

	const navigateHome = useCallback(() => {
		if (!hideConversationAfterClosing) {
			return;
		}

		if (omnichannelDirectoryRouter.getRouteName()) {
			omnichannelDirectoryRouter.navigate();
		} else {
			router.navigate({ name: 'home' });
		}
	}, [hideConversationAfterClosing, omnichannelDirectoryRouter, router]);

	return { navigateHome };
};

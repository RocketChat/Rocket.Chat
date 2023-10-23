import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { useIsOverMacLimit } from '../../../../client/hooks/omnichannel/useIsOverMacLimit';

export const useCurrentChatsHighlight = () => {
	const isOverMacLimit = useIsOverMacLimit();
	const [isHighlightVisible, setHighlight] = useLocalStorage<boolean>('omnichannel-current-chats-highlight', isOverMacLimit);
	const router = useRouter();

	useEffect(() => {
		if (!isHighlightVisible) {
			return;
		}

		return router.subscribeToRouteChange(() => {
			if (router.getRouteName() !== 'omnichannel-current-chats') {
				return;
			}

			setHighlight(false);
		});
	}, [isHighlightVisible, router, setHighlight]);

	return {
		isHighlightVisible,
	};
};

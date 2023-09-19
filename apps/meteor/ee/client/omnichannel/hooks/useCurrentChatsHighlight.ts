import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { useIsOverMacLimit } from '../../../../client/hooks/omnichannel/useIsOverMacLimit';

export const useCurrentChatsHighlight = () => {
	const isOverMacLimit = useIsOverMacLimit();
	const [isHighlit, setHighlight] = useLocalStorage<boolean>('omnichannel-current-chats-highlight', isOverMacLimit);
	const router = useRouter();

	useEffect(() => {
		if (!isHighlit) {
			return;
		}

		return router.subscribeToRouteChange(() => {
			if (router.getRouteName() !== 'omnichannel-current-chats') {
				return;
			}

			setHighlight(false);
		});
	}, [isHighlit, router, setHighlight]);

	return {
		isHighlit,
	};
};

import { useRouter } from '@rocket.chat/ui-contexts';
import type { MessageNavigationContextValue } from '@rocket.chat/ui-message-list';
import { useMemo } from 'react';

import { useExternalLink } from '../../hooks/useExternalLink';
import { actionLinks } from '../../lib/actionLinks';
import { getPermaLink } from '../../lib/getPermaLink';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';
import { setMessageJumpQueryStringParameter } from '../../lib/utils/setMessageJumpQueryStringParameter';
import { useGoToRoom } from '../../views/room/hooks/useGoToRoom';
import { useGoToThread } from '../../views/room/hooks/useGoToThread';

/** Where a click on a message takes the viewer, through the router of the app. */
export const useMessageNavigationValue = (): MessageNavigationContextValue => {
	const router = useRouter();
	const goToRoom = useGoToRoom();
	const goToThread = useGoToThread();
	const openExternalLink = useExternalLink();

	return useMemo(
		() => ({
			openRoom: (rid) => {
				void goToRoom(rid);
			},
			openThread: ({ rid, tmid, messageId }) => goToThread({ rid, tmid, msg: messageId }),
			replyInThread: (message) => {
				const routeName = router.getRouteName();

				if (routeName) {
					router.navigate({
						name: routeName,
						params: { ...router.getRouteParameters(), tab: 'thread', context: message.tmid || message._id },
					});
				}
			},
			jumpToMessage: (message) => setMessageJumpQueryStringParameter(message._id),
			getPermalink: (messageId) => getPermaLink(messageId),
			openDirectMessage: (username) => {
				const { msg: _, ...searchParameters } = router.getSearchParameters();
				roomCoordinator.openRouteLink('d', { name: username }, searchParameters);
			},
			runActionLink: (message, methodId) => actionLinks.run(methodId, message),
			openExternalLink,
		}),
		[router, goToRoom, goToThread, openExternalLink],
	);
};

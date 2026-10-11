import { isThreadMainMessage, isThreadMessage } from '@rocket.chat/core-typings';
import { useEndpoint, useRouteParameter, useSearchParameter } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { RoomManager } from '../../../../lib/RoomManager';
import { messagesQueryKeys } from '../../../../lib/queryKeys';
import { mapMessageFromApi } from '../../../../lib/utils/mapMessageFromApi';
import { useGoToRoom } from '../../hooks/useGoToRoom';

const useTryToJumpToThreadMessage = (): void => {
	const messageJumpParam = useSearchParameter('msg');
	const messageJumpContext = useSearchParameter('jumpContext');
	const goToRoom = useGoToRoom();
	const tab = useRouteParameter('tab');
	const context = useRouteParameter('context');

	const getMessage = useEndpoint('GET', '/v1/chat.getMessage');

	const { data: message } = useQuery({
		queryKey: messageJumpParam ? messagesQueryKeys.message(messageJumpParam) : [],
		queryFn: async () => {
			if (!messageJumpParam) return null;
			const { message: raw } = await getMessage({ msgId: messageJumpParam });
			return mapMessageFromApi(raw);
		},
		enabled: !!messageJumpParam,
	});

	useEffect(() => {
		if (!messageJumpParam || messageJumpContext === 'jumpToUnread') {
			return;
		}

		if (!message) {
			return;
		}

		if (!isThreadMessage(message) && !isThreadMainMessage(message)) {
			return;
		}
		if (tab === 'thread' && (context === message.tmid || context === message._id)) {
			return;
		}

		(async () => {
			await goToRoom(message.rid, {
				routeParamsOverrides: { tab: 'thread', context: message.tmid || message._id },
				replace: RoomManager.opened === message.rid,
			});
		})();
	}, [messageJumpParam, message, goToRoom, tab, context, messageJumpContext]);
};

export default useTryToJumpToThreadMessage;

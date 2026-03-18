import { isThreadMainMessage, isThreadMessage } from '@rocket.chat/core-typings';
import type { IMessage } from '@rocket.chat/core-typings';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useRouteParameter, useSearchParameter } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { RoomHistoryManager } from '../../../../../app/ui-utils/client';
import { RoomManager } from '../../../../lib/RoomManager';
import { messagesQueryKeys } from '../../../../lib/queryKeys';
import { mapMessageFromApi } from '../../../../lib/utils/mapMessageFromApi';
import { useGoToRoom } from '../../hooks/useGoToRoom';

export const useLoadSurroundingMessages = () => {
	const msgId = useSearchParameter('msg');

	const jumpToRef = useRef<HTMLElement>(undefined);

	const getMessage = useEndpoint('GET', '/v1/chat.getMessage');

	const { data: message } = useQuery({
		queryKey: msgId ? messagesQueryKeys.message(msgId) : [],
		queryFn: async () => {
			if (!msgId) return null;
			const { message } = await getMessage({ msgId });
			return mapMessageFromApi(message);
		},
		enabled: !!msgId,
	});

	const tab = useRouteParameter('tab');
	const context = useRouteParameter('context');
	const goToRoom = useGoToRoom();

	const handleThreadMessage = useStableCallback(async (message: IMessage) => {
		await goToRoom(message.rid, {
			routeParamsOverrides: { tab: 'thread', context: message.tmid || message._id },
			replace: RoomManager.opened === message.rid,
		});

		if (message.tcount) {
			await RoomHistoryManager.getSurroundingChannelMessages(message);
		} else if (!RoomHistoryManager.isLoaded(message.rid)) {
			await RoomHistoryManager.getMore(message.rid);
		}
	});

	const handleRegularMessage = useStableCallback(async (message: IMessage) => {
		if (RoomManager.opened === message.rid) {
			await RoomHistoryManager.getSurroundingChannelMessages(message);
			return;
		}

		await goToRoom(message.rid);

		await RoomHistoryManager.getSurroundingChannelMessages(message);
	});

	useEffect(() => {
		if (jumpToRef.current) return;

		if (!message) return;

		if (isThreadMessage(message) || isThreadMainMessage(message)) {
			if (tab === 'thread' && (context === message.tmid || context === message._id)) return;

			handleThreadMessage(message);
			return;
		}

		handleRegularMessage(message);
	}, [msgId, getMessage, message, tab, context, handleRegularMessage, handleThreadMessage]);

	return { jumpToRef };
};

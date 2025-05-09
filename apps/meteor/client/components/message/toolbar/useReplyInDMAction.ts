import { type IMessage, type ISubscription, type IRoom, isE2EEMessage } from '@rocket.chat/core-typings';
import { usePermission, useRouter, useUser } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import { Rooms, Subscriptions } from '../../../../app/models/client';
import type { MessageActionConfig } from '../../../../app/ui-utils/client/lib/MessageAction';
import { useEmbeddedLayout } from '../../../hooks/useEmbeddedLayout';
import { useReactiveValue } from '../../../hooks/useReactiveValue';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';

export const useReplyInDMAction = (
	message: IMessage,
	{ room, subscription }: { room: IRoom; subscription: ISubscription | undefined },
): MessageActionConfig | null => {
	const user = useUser();
	const router = useRouter();
	const encrypted = isE2EEMessage(message);
	const canCreateDM = usePermission('create-d');
	const isLayoutEmbedded = useEmbeddedLayout();

	const condition = useReactiveValue(
		useCallback(() => {
			if (!subscription || room.t === 'd' || room.t === 'l' || isLayoutEmbedded) {
				return false;
			}

			// Check if we already have a DM started with the message user (not ourselves) or we can start one
			if (!!user && user._id !== message.u._id && !canCreateDM) {
				const dmRoom = Rooms.findOne({ _id: [user._id, message.u._id].sort().join('') });
				if (!dmRoom || !Subscriptions.findOne({ 'rid': dmRoom._id, 'u._id': user._id })) {
					return false;
				}
			}

			return true;
		}, [canCreateDM, isLayoutEmbedded, message.u._id, room.t, subscription, user]),
	);

	if (!condition) {
		return null;
	}

	return {
		id: 'reply-directly',
		icon: 'reply-directly',
		label: 'Reply_in_direct_message',
		context: ['message', 'message-mobile', 'threads', 'federated'],
		type: 'communication',
		action() {
			roomCoordinator.openRouteLink(
				'd',
				{ name: message.u.username },
				{
					...router.getSearchParameters(),
					reply: message._id,
				},
			);
		},
		order: 0,
		group: 'menu',
		disabled: encrypted,
	};
};

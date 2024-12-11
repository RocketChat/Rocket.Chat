import { type IMessage, type ISubscription, type IRoom, isE2EEMessage } from '@rocket.chat/core-typings';
import { usePermission, useRouter, useUser } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { Rooms, Subscriptions } from '../../../../app/models/client';
import { MessageAction } from '../../../../app/ui-utils/client';
import { useEmbeddedLayout } from '../../../hooks/useEmbeddedLayout';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';

export const useReplyInDMAction = (message: IMessage, { room, subscription }: { room: IRoom; subscription: ISubscription | undefined }) => {
	const user = useUser();
	const router = useRouter();
	const encrypted = isE2EEMessage(message);
	const canCreateDM = usePermission('create-d');
	const isLayoutEmbedded = useEmbeddedLayout();

	useEffect(() => {
		if (!subscription || room.t === 'd' || room.t === 'l' || isLayoutEmbedded) {
			return;
		}

		MessageAction.addButton({
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
			condition() {
				// Check if we already have a DM started with the message user (not ourselves) or we can start one
				if (!!user && user._id !== message.u._id && !canCreateDM) {
					const dmRoom = Rooms.findOne({ _id: [user._id, message.u._id].sort().join('') });
					if (!dmRoom || !Subscriptions.findOne({ 'rid': dmRoom._id, 'u._id': user._id })) {
						return false;
					}
				}

				return true;
			},
			order: 0,
			group: 'menu',
			disabled: encrypted,
		});

		return () => {
			MessageAction.removeButton('reply-directly');
		};
	}, [canCreateDM, encrypted, isLayoutEmbedded, message._id, message.u._id, message.u.username, room.t, router, subscription, user]);
};

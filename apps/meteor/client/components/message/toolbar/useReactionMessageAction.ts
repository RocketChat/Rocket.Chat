import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import type { IRoom, ISubscription, IUser, IMessage } from '@rocket.chat/core-typings';
import { useEffect } from 'react';

import { MessageAction } from '../../../../app/ui-utils/client';
import { sdk } from '../../../../app/utils/client/lib/SDKClient';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';

export const useReactionMessageAction = (
	message: IMessage,
	{ user, room, subscription }: { user: IUser | undefined; room: IRoom; subscription: ISubscription | undefined },
) => {
	useEffect(() => {
		if (!room || isOmnichannelRoom(room) || !subscription || message.private || !user) {
			return;
		}

		if (roomCoordinator.readOnly(room._id, user) && !room.reactWhenReadOnly) {
			return;
		}

		MessageAction.addButton({
			id: 'reaction-message',
			icon: 'add-reaction',
			label: 'Add_Reaction',
			context: ['message', 'message-mobile', 'threads', 'federated', 'videoconf', 'videoconf-threads'],
			action(event, { message, chat }) {
				event?.stopPropagation();
				chat?.emojiPicker.open(event?.currentTarget as Element, (emoji) => sdk.call('setReaction', `:${emoji}:`, message._id));
			},
			order: -3,
			group: 'message',
		});

		return () => {
			MessageAction.removeButton('reaction-message');
		};
	}, [message.private, room, subscription, user]);
};

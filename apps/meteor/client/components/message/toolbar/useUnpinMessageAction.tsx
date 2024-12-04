import type { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { useSetting, usePermission } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { MessageAction } from '../../../../app/ui-utils/client/lib/MessageAction';
import { useUnpinMessageMutation } from '../hooks/useUnpinMessageMutation';

export const useUnpinMessageAction = (
	message: IMessage,
	{ room, subscription }: { room: IRoom; subscription: ISubscription | undefined },
) => {
	const allowPinning = useSetting('Message_AllowPinning');
	const hasPermission = usePermission('pin-message', room._id);

	const { mutate: unpinMessage } = useUnpinMessageMutation();

	useEffect(() => {
		if (!allowPinning || isOmnichannelRoom(room) || !hasPermission || !message.pinned || !subscription) {
			return;
		}

		MessageAction.addButton({
			id: 'unpin-message',
			icon: 'pin',
			label: 'Unpin',
			type: 'interaction',
			context: ['pinned', 'message', 'message-mobile', 'threads', 'direct', 'videoconf', 'videoconf-threads'],
			action() {
				unpinMessage(message);
			},
			order: 2,
			group: 'menu',
		});

		return () => {
			MessageAction.removeButton('unpin-message');
		};
	}, [allowPinning, hasPermission, message, room, subscription, unpinMessage]);
};

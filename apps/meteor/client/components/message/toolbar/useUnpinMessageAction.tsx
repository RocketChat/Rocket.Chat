import type { IRoom } from '@rocket.chat/core-typings';
import { usePermission, useSetting, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { MessageAction } from '../../../../app/ui-utils/client/lib/MessageAction';
import { sdk } from '../../../../app/utils/client/lib/SDKClient';
import { queryClient } from '../../../lib/queryClient';

export const useUnpinMessageAction = (room: IRoom) => {
	const dispatchToastMessage = useToastMessageDispatch();

	const allowPinning = useSetting('Message_AllowPinning');
	const hasPermission = usePermission('pin-message', room._id);

	useEffect(() => {
		if (!allowPinning || !hasPermission) {
			return () => {
				MessageAction.removeButton('unpin-message');
			};
		}

		MessageAction.addButton({
			id: 'unpin-message',
			icon: 'pin',
			label: 'Unpin',
			type: 'interaction',
			context: ['pinned', 'message', 'message-mobile', 'threads', 'direct', 'videoconf', 'videoconf-threads'],
			async action(_, { message }) {
				message.pinned = false;
				try {
					await sdk.call('unpinMessage', message);
					queryClient.invalidateQueries(['rooms', message.rid, 'pinned-messages']);
				} catch (error) {
					dispatchToastMessage({ type: 'error', message: error });
				}
			},
			condition({ message, subscription }) {
				if (!subscription || !message.pinned) {
					return false;
				}
				return true;
			},
			order: 2,
			group: 'menu',
		});

		return () => {
			MessageAction.removeButton('unpin-message');
		};
	}, [allowPinning, dispatchToastMessage, hasPermission]);
};

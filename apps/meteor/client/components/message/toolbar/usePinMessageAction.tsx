import type { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { useSetting, useToastMessageDispatch, useSetModal, usePermission } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { MessageAction } from '../../../../app/ui-utils/client/lib/MessageAction';
import { sdk } from '../../../../app/utils/client/lib/SDKClient';
import { queryClient } from '../../../lib/queryClient';
import PinMessageModal from '../../../views/room/modals/PinMessageModal';

export const usePinMessageAction = (
	message: IMessage,
	{ room, subscription }: { room: IRoom; subscription: ISubscription | undefined },
) => {
	const dispatchToastMessage = useToastMessageDispatch();

	const setModal = useSetModal();

	const allowPinning = useSetting('Message_AllowPinning');
	const hasPermission = usePermission('pin-message', room._id);

	useEffect(() => {
		if (!allowPinning || isOmnichannelRoom(room) || !hasPermission || message.pinned || !subscription) {
			return () => {
				MessageAction.removeButton('pin-message');
			};
		}

		const onConfirm = async () => {
			try {
				await sdk.call('pinMessage', message);
				queryClient.invalidateQueries(['rooms', message.rid, 'pinned-messages']);
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			setModal(null);
		};

		MessageAction.addButton({
			id: 'pin-message',
			icon: 'pin',
			label: 'Pin',
			type: 'interaction',
			context: ['pinned', 'message', 'message-mobile', 'threads', 'direct', 'videoconf', 'videoconf-threads'],
			async action() {
				setModal({
					component: PinMessageModal,
					props: {
						message,
						onConfirm,
						onCancel: () => setModal(null),
					},
				});
			},
			order: 2,
			group: 'menu',
		});

		return () => {
			MessageAction.removeButton('pin-message');
		};
	}, [allowPinning, dispatchToastMessage, hasPermission, message, room, setModal, subscription]);
};

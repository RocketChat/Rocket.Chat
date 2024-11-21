import { useSetting, useToastMessageDispatch, useSetModal } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { hasAtLeastOnePermission } from '../../../../app/authorization/client';
import { MessageAction } from '../../../../app/ui-utils/client/lib/MessageAction';
import { sdk } from '../../../../app/utils/client/lib/SDKClient';
import { queryClient } from '../../../lib/queryClient';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import PinMessageModal from '../../../views/room/modals/PinMessageModal';

export const usePinMessageAction = () => {
	const dispatchToastMessage = useToastMessageDispatch();

	const setModal = useSetModal();

	const allowPinning = useSetting('Message_AllowPinning');

	useEffect(() => {
		MessageAction.addButton({
			id: 'pin-message',
			icon: 'pin',
			label: 'Pin',
			type: 'interaction',
			context: ['pinned', 'message', 'message-mobile', 'threads', 'direct', 'videoconf', 'videoconf-threads'],
			async action(_, { message }) {
				const onConfirm = async () => {
					message.pinned = true;
					try {
						await sdk.call('pinMessage', message);
						queryClient.invalidateQueries(['rooms', message.rid, 'pinned-messages']);
					} catch (error) {
						dispatchToastMessage({ type: 'error', message: error });
					}
					setModal(null);
				};

				setModal({
					component: PinMessageModal,
					props: {
						message,
						onConfirm,
						onCancel: () => setModal(null),
					},
				});
			},
			condition({ message, subscription, room }) {
				if (!allowPinning || message.pinned || !subscription) {
					return false;
				}
				const isLivechatRoom = roomCoordinator.isLivechatRoom(room.t);
				if (isLivechatRoom) {
					return false;
				}
				return hasAtLeastOnePermission('pin-message', message.rid);
			},
			order: 2,
			group: 'menu',
		});

		return () => {
			MessageAction.removeButton('pin-message');
		};
	}, [allowPinning, dispatchToastMessage, setModal]);
};

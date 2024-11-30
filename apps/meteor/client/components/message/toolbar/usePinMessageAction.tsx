import type { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { useSetting, useSetModal, usePermission } from '@rocket.chat/ui-contexts';
import React, { useEffect } from 'react';

import { MessageAction } from '../../../../app/ui-utils/client/lib/MessageAction';
import PinMessageModal from '../../../views/room/modals/PinMessageModal';
import { usePinMessageMutation } from '../hooks/usePinMessageMutation';

export const usePinMessageAction = (
	message: IMessage,
	{ room, subscription }: { room: IRoom; subscription: ISubscription | undefined },
) => {
	const setModal = useSetModal();

	const allowPinning = useSetting('Message_AllowPinning');
	const hasPermission = usePermission('pin-message', room._id);
	const { mutateAsync: pinMessage } = usePinMessageMutation();

	useEffect(() => {
		if (!allowPinning || isOmnichannelRoom(room) || !hasPermission || message.pinned || !subscription) {
			return;
		}

		const onConfirm = async () => {
			pinMessage(message);
			setModal(null);
		};

		MessageAction.addButton({
			id: 'pin-message',
			icon: 'pin',
			label: 'Pin',
			type: 'interaction',
			context: ['pinned', 'message', 'message-mobile', 'threads', 'direct', 'videoconf', 'videoconf-threads'],
			async action() {
				setModal(<PinMessageModal message={message} onConfirm={onConfirm} onCancel={() => setModal(null)} />);
			},
			order: 2,
			group: 'menu',
		});

		return () => {
			MessageAction.removeButton('pin-message');
		};
	}, [allowPinning, hasPermission, message, pinMessage, room, setModal, subscription]);
};

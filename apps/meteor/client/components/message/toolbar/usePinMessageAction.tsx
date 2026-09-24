import type { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { useSetModal } from '@rocket.chat/ui-contexts';

import { useMessageActionsPolicy } from './MessageActionsPolicy';
import type { MessageActionConfig } from '../../../lib/MessageAction';
import PinMessageModal from '../../../views/room/modals/PinMessageModal';
import { usePinMessageMutation } from '../hooks/usePinMessageMutation';

export const usePinMessageAction = (
	message: IMessage,
	{ room, subscription }: { room: IRoom; subscription: ISubscription | undefined },
): MessageActionConfig | null => {
	const policy = useMessageActionsPolicy();
	const setModal = useSetModal();

	const { allowPinning } = policy.settings;
	const hasPermission = policy.permissions.pinMessage;
	const { mutateAsync: pinMessage } = usePinMessageMutation();

	if (!allowPinning || isOmnichannelRoom(room) || !hasPermission || message.pinned || !subscription) {
		return null;
	}

	const onConfirm = async () => {
		pinMessage(message);
		setModal(null);
	};

	return {
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
	};
};

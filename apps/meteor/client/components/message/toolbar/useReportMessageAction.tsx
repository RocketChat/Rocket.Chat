import type { ISubscription, IRoom, IMessage } from '@rocket.chat/core-typings';
import { useSetModal, useUser } from '@rocket.chat/ui-contexts';

import type { MessageActionConfig } from '../../../../app/ui-utils/client/lib/MessageAction';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import ReportMessageModal from '../../../views/room/modals/ReportMessageModal';

const getMainMessageText = (message: IMessage): IMessage => {
	const newMessage = { ...message };
	newMessage.msg = newMessage.msg || newMessage.attachments?.[0]?.description || newMessage.attachments?.[0]?.title || '';
	newMessage.md = newMessage.md || newMessage.attachments?.[0]?.descriptionMd || undefined;
	return { ...newMessage };
};

export const useReportMessageAction = (
	message: IMessage,
	{ room, subscription }: { room: IRoom; subscription: ISubscription | undefined },
): MessageActionConfig | null => {
	const user = useUser();
	const setModal = useSetModal();

	const isLivechatRoom = roomCoordinator.isLivechatRoom(room.t);

	if (!subscription) {
		return null;
	}

	if (isLivechatRoom || message.u._id === user?._id) {
		return null;
	}

	return {
		id: 'report-message',
		icon: 'report',
		label: 'Report',
		context: ['message', 'message-mobile', 'threads', 'federated', 'videoconf', 'videoconf-threads'],
		color: 'alert',
		type: 'management',
		action() {
			setModal(
				<ReportMessageModal
					message={getMainMessageText(message)}
					onClose={() => {
						setModal(null);
					}}
				/>,
			);
		},
		order: 9,
		group: 'menu',
	};
};

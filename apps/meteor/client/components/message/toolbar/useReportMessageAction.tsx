import type { ISubscription, IUser, IRoom, IMessage } from '@rocket.chat/core-typings';
import { useSetModal } from '@rocket.chat/ui-contexts';
import React, { useEffect } from 'react';

import { MessageAction } from '../../../../app/ui-utils/client';
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
	{ user, room, subscription }: { user: IUser | undefined; room: IRoom; subscription: ISubscription | undefined },
) => {
	const setModal = useSetModal();

	const isLivechatRoom = roomCoordinator.isLivechatRoom(room.t);

	useEffect(() => {
		if (!subscription) {
			return;
		}

		if (isLivechatRoom || message.u._id === user?._id) {
			return;
		}

		MessageAction.addButton({
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
		});

		return () => {
			MessageAction.removeButton('report-message');
		};
	}, [isLivechatRoom, message, setModal, subscription, user?._id]);
};

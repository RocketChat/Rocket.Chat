import type { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import type { ReactElement } from 'react';

import MessageToolbarItem from '../../MessageToolbarItem';
import { useDeleteMessageAction } from '../../useDeleteMessageAction';

type DeleteMessageActionProps = {
	message: IMessage;
	room: IRoom;
	subscription: ISubscription | undefined;
};

const DeleteMessageAction = ({ message, room, subscription }: DeleteMessageActionProps): ReactElement | null => {
	const deleteAction = useDeleteMessageAction(message, { room, subscription });

	if (!deleteAction) {
		return null;
	}

	return (
		<MessageToolbarItem
			id={deleteAction.id}
			icon={deleteAction.icon}
			title={deleteAction.label}
			danger
			qa='delete-message'
			onClick={deleteAction.action}
		/>
	);
};

export default DeleteMessageAction;
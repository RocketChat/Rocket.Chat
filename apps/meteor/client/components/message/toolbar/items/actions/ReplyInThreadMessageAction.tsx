import {
	type IMessage,
	type ISubscription,
	type IRoom,
	isOmnichannelRoom,
	isRoomFederated,
	isRoomNativeFederated,
} from '@rocket.chat/core-typings';
import { useTranslation } from 'react-i18next';

import { useMessageActions, useMessageActionsPolicy } from '../../../list/MessageListContext';
import MessageToolbarItem from '../../MessageToolbarItem';

export type ReplyInThreadMessageActionProps = {
	message: IMessage;
	room: IRoom;
	subscription: ISubscription | undefined;
};

const ReplyInThreadMessageAction = ({ message, room, subscription }: ReplyInThreadMessageActionProps) => {
	const threadsEnabled = useMessageActionsPolicy().settings.threadsEnabled ?? true;
	const actions = useMessageActions();
	const { t } = useTranslation();

	if (!threadsEnabled || isOmnichannelRoom(room) || !subscription) {
		return null;
	}
	const isFederated = room && isRoomFederated(room);
	const isFederationBlocked = isFederated && !isRoomNativeFederated(room);

	if (isFederationBlocked) {
		return null;
	}

	return (
		<MessageToolbarItem
			id='reply-in-thread'
			icon='thread'
			title={t('Reply_in_thread')}
			onClick={(event) => {
				event.stopPropagation();
				actions.replyInThread(message);
			}}
		/>
	);
};

export default ReplyInThreadMessageAction;

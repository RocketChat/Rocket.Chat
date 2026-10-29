import { isOmnichannelRoom, isRoomFederated, isRoomNativeFederated } from '@rocket.chat/core-typings';
import type { IMessage, ISubscription, IRoom } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { useMessageNavigation } from '../../../contexts/MessageNavigationContext';
import MessageToolbarItem from '../../MessageToolbarItem';

export type ReplyInThreadMessageActionProps = {
	message: IMessage;
	room: IRoom;
	subscription: ISubscription | undefined;
};

const ReplyInThreadMessageAction = ({ message, room, subscription }: ReplyInThreadMessageActionProps) => {
	const { openThread } = useMessageNavigation();
	const threadsEnabled = useSetting('Threads_enabled', true);
	const { t } = useTranslation();

	if (!threadsEnabled || isOmnichannelRoom(room) || !subscription) {
		return null;
	}

	const isFederationBlocked = isRoomFederated(room) && !isRoomNativeFederated(room);

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
				openThread({ rid: message.rid, tmid: message.tmid || message._id });
			}}
		/>
	);
};

export default ReplyInThreadMessageAction;

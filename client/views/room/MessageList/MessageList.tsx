import { Message as MessageTemplate, MessageDivider, Box, Skeleton } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { isSameDay } from 'date-fns';
import React, {
	FC,
	useCallback,
	useLayoutEffect,
	useRef,
	useState,
	useEffect,
	Fragment,
} from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';

import { IRoom } from '../../../../definition/IRoom';
import RoomForeword from '../../../components/RoomForeword';
import ScrollableContentWrapper from '../../../components/ScrollableContentWrapper';
import { useFormatDate } from '../../../hooks/useFormatDate';
import { useRoom, useRoomContext } from '../providers/RoomProvider';
import Message from './components/Message';
import { useMessages } from './hooks/useMessages';
import { isMessageSequential } from './lib/isMessageSequential';

import { useTranslation } from '/client/contexts/TranslationContext';
import { useUserSubscription } from '/client/contexts/UserContext';
import { IMessage } from '/definition/IMessage';
import { ISubscription } from '/definition/ISubscription';

const isMessageUnread = (
	subscription: ISubscription,
	message: IMessage,
	previous: IMessage,
): boolean => {
	// if (!subscription || (!subscription.alert && subscription.unread === 0)) {
	// 	return false;
	// }
	if (previous && previous.ts > subscription.ls) {
		return false;
	}
	return message.ts > subscription.ls;
};

export const MessageList: FC<{ rid: IRoom['_id'] }> = ({ rid }) => {
	// const room = useRoom() as IRoom;

	const t = useTranslation();
	const virtuoso = useRef<VirtuosoHandle>(null);

	const messages = useMessages({ rid });

	const subscription = useUserSubscription(rid);

	const prepending = useRef(0);
	// const [firstItemIndex, setFirstItemIndex] = useState(room.msgs);
	const format = useFormatDate();
	// const { getMore } = useRoomContext();

	// useEffect(() => {
	// 	setFirstItemIndex(room.msgs - messages.length);
	// 	prepending.current = messages.length;
	// }, [room._id]);

	// const more = useMutableCallback(() => {
	// 	prepending.current = messages.length;
	// 	getMore();
	// });

	// useLayoutEffect(() => {
	// 	setFirstItemIndex(() => room.msgs - messages.length);
	// }, [messages.length]);
	return messages.map((message, index) => {
		// const index = messages.findIndex((m) => m === message);
		const previous = messages[index - 1];

		const sequential = isMessageSequential(message, previous);

		const newDay = !previous || !isSameDay(message.ts, previous.ts);

		const unread = subscription && isMessageUnread(subscription, message, previous);
		return (
			<Fragment key={message._id}>
				{(newDay || unread) && (
					<MessageDivider unreadLabel={unread ? t('Unread_Messages').toLowerCase() : undefined}>
						{newDay && format(message.ts)}
					</MessageDivider>
				)}
				<Message
					data-mid={message._id}
					data-unread={unread}
					sequential={sequential}
					message={message}
				/>
			</Fragment>
		);
	});
};

export default MessageList;

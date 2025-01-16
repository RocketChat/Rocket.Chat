import type { IRoom, ISubscription, IMessage } from '@rocket.chat/core-typings';
import { CheckBox } from '@rocket.chat/fuselage';

import ForwardMessageAction from './actions/ForwardMessageAction';
import QuoteMessageAction from './actions/QuoteMessageAction';
import ReactionMessageAction from './actions/ReactionMessageAction';
import ReplyInThreadMessageAction from './actions/ReplyInThreadMessageAction';
import { useIsSelectedMessage, useToggleSelect } from '../../../../views/room/MessageList/contexts/SelectedMessagesContext';
import { useDeleteMessageAction } from '../useDeleteMessageAction';

type DefaultItemsProps = {
	message: IMessage;
	room: IRoom;
	subscription: ISubscription | undefined;
};

const DefaultItems = ({ message, room, subscription }: DefaultItemsProps) => {
	const isSelected = useIsSelectedMessage(message._id);
	const toggleSelect = useToggleSelect(message._id);
	const deleteAction = useDeleteMessageAction(message, { room, subscription });

	return (
		<>
			<ReactionMessageAction message={message} room={room} subscription={subscription} />
			<QuoteMessageAction message={message} subscription={subscription} />
			<ReplyInThreadMessageAction message={message} room={room} subscription={subscription} />
			<ForwardMessageAction message={message} />
			{deleteAction && <CheckBox checked={isSelected} onChange={toggleSelect} aria-label='Select message for deletion' mie={4} />}
		</>
	);
};

export default DefaultItems;

import type { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import JumpToMessageAction from './actions/JumpToMessageAction';
import ReplyInThreadMessageAction from './actions/ReplyInThreadMessageAction';

type PinnedItemsProps = {
	message: IMessage;
	room: IRoom;
	subscription: ISubscription | undefined;
};

const PinnedItems = ({ message, room, subscription }: PinnedItemsProps) => {
	return (
		<>
			<ReplyInThreadMessageAction message={message} room={room} subscription={subscription} />
			<JumpToMessageAction id='jump-to-pin-message' message={message} />
		</>
	);
};

export default PinnedItems;

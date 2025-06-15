import type { IRoom, ISubscription, IMessage } from '@rocket.chat/core-typings';

import ForwardMessageAction from './actions/ForwardMessageAction';
import JumpToMessageAction from './actions/JumpToMessageAction';
import QuoteMessageAction from './actions/QuoteMessageAction';
import ReactionMessageAction from './actions/ReactionMessageAction';
import ReplyInThreadMessageAction from './actions/ReplyInThreadMessageAction';

type MobileItemsProps = {
	message: IMessage;
	room: IRoom;
	subscription: ISubscription | undefined;
};

const MobileItems = ({ message, room, subscription }: MobileItemsProps) => {
	return (
		<>
			<ReactionMessageAction message={message} room={room} subscription={subscription} />
			<QuoteMessageAction message={message} subscription={subscription} />
			<ReplyInThreadMessageAction message={message} room={room} subscription={subscription} />
			<ForwardMessageAction message={message} />
			<JumpToMessageAction id='jump-to-message' message={message} />
		</>
	);
};

export default MobileItems;

import type { IRoom, ISubscription, IMessage } from '@rocket.chat/core-typings';

import QuoteMessageAction from './actions/QuoteMessageAction';
import ReactionMessageAction from './actions/ReactionMessageAction';
import ReplyInThreadMessageAction from './actions/ReplyInThreadMessageAction';

export type FederatedItemsProps = {
	message: IMessage;
	room: IRoom;
	subscription: ISubscription | undefined;
	onChangeMenuVisibility?: (visible: boolean) => void;
};

const FederatedItems = ({ message, room, subscription, onChangeMenuVisibility }: FederatedItemsProps) => {
	return (
		<>
			<ReactionMessageAction message={message} room={room} subscription={subscription} onChangeMenuVisibility={onChangeMenuVisibility} />
			<QuoteMessageAction message={message} subscription={subscription} />
			<ReplyInThreadMessageAction message={message} room={room} subscription={subscription} />
		</>
	);
};

export default FederatedItems;

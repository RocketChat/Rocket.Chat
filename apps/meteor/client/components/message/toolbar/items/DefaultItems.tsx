import type { IRoom, ISubscription, IMessage } from '@rocket.chat/core-typings';
import { useUserPreference } from '@rocket.chat/ui-contexts';

import ForwardMessageAction from './actions/ForwardMessageAction';
import QuoteMessageAction from './actions/QuoteMessageAction';
import ReactionMessageAction from './actions/ReactionMessageAction';
import ReplyInThreadMessageAction from './actions/ReplyInThreadMessageAction';

type DefaultItemsProps = {
	message: IMessage;
	room: IRoom;
	subscription: ISubscription | undefined;
};

const DefaultItems = ({ message, room, subscription }: DefaultItemsProps) => {
	const enableEmojis = useUserPreference<boolean>('useEmojis');

	return (
		<>
			{enableEmojis && <ReactionMessageAction message={message} room={room} subscription={subscription} />}
			<QuoteMessageAction message={message} subscription={subscription} />
			<ReplyInThreadMessageAction message={message} room={room} subscription={subscription} />
			<ForwardMessageAction message={message} room={room} />
		</>
	);
};

export default DefaultItems;

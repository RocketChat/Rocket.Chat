import type { IRoom, ISubscription, IMessage } from '@rocket.chat/core-typings';

import ReactionMessageAction from './actions/ReactionMessageAction';
import ReplyInThreadMessageAction from './actions/ReplyInThreadMessageAction';

type VideoconfItemsProps = {
	message: IMessage;
	room: IRoom;
	subscription: ISubscription | undefined;
};

const VideoconfItems = ({ message, room, subscription }: VideoconfItemsProps) => {
	return (
		<>
			<ReactionMessageAction message={message} room={room} subscription={subscription} />
			<ReplyInThreadMessageAction message={message} room={room} subscription={subscription} />
		</>
	);
};

export default VideoconfItems;

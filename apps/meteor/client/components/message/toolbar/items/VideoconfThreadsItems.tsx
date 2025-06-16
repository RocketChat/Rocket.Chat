import type { IRoom, ISubscription, IMessage } from '@rocket.chat/core-typings';

import JumpToMessageAction from './actions/JumpToMessageAction';
import ReactionMessageAction from './actions/ReactionMessageAction';

type VideoconfThreadsItemsProps = {
	message: IMessage;
	room: IRoom;
	subscription: ISubscription | undefined;
};

const VideoconfThreadsItems = ({ message, room, subscription }: VideoconfThreadsItemsProps) => {
	return (
		<>
			<ReactionMessageAction message={message} room={room} subscription={subscription} />
			<JumpToMessageAction id='jump-to-message' message={message} />
		</>
	);
};

export default VideoconfThreadsItems;

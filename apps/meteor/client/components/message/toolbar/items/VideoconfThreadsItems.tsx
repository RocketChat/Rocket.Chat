import type { IRoom, ISubscription, IMessage } from '@rocket.chat/core-typings';

import JumpToMessageAction from './actions/JumpToMessageAction';
import ReactionMessageAction from './actions/ReactionMessageAction';

export type VideoconfThreadsItemsProps = {
	message: IMessage;
	room: IRoom;
	subscription: ISubscription | undefined;
	onChangeMenuVisibility?: (visible: boolean) => void;
};

const VideoconfThreadsItems = ({ message, room, subscription, onChangeMenuVisibility }: VideoconfThreadsItemsProps) => {
	return (
		<>
			<ReactionMessageAction message={message} room={room} subscription={subscription} onChangeMenuVisibility={onChangeMenuVisibility} />
			<JumpToMessageAction id='jump-to-message' message={message} />
		</>
	);
};

export default VideoconfThreadsItems;

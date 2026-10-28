import type { IRoom, ISubscription, IMessage } from '@rocket.chat/core-typings';

import ReactionMessageAction from './actions/ReactionMessageAction';
import ReplyInThreadMessageAction from './actions/ReplyInThreadMessageAction';

export type VideoconfItemsProps = {
	message: IMessage;
	room: IRoom;
	subscription: ISubscription | undefined;
	onChangeMenuVisibility?: (visible: boolean) => void;
};

const VideoconfItems = ({ message, room, subscription, onChangeMenuVisibility }: VideoconfItemsProps) => {
	return (
		<>
			<ReactionMessageAction message={message} room={room} subscription={subscription} onChangeMenuVisibility={onChangeMenuVisibility} />
			<ReplyInThreadMessageAction message={message} room={room} subscription={subscription} />
		</>
	);
};

export default VideoconfItems;

import type { IRoom, ISubscription, IMessage } from '@rocket.chat/core-typings';

import JumpToMessageAction from './actions/JumpToMessageAction';

type StarredItemsProps = {
	message: IMessage;
	room: IRoom;
	subscription: ISubscription | undefined;
};

const StarredItems = ({ message }: StarredItemsProps) => {
	return (
		<>
			<JumpToMessageAction id='jump-to-star-message' message={message} />
		</>
	);
};

export default StarredItems;

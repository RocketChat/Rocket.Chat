import type { IRoom, ISubscription, IMessage } from '@rocket.chat/core-typings';

import JumpToMessageAction from './actions/JumpToMessageAction';

type MentionsItemsProps = {
	message: IMessage;
	room: IRoom;
	subscription: ISubscription | undefined;
};

const MentionsItems = ({ message }: MentionsItemsProps) => {
	return (
		<>
			<JumpToMessageAction id='jump-to-message' message={message} />
		</>
	);
};

export default MentionsItems;

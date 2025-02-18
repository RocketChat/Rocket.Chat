import type { IRoom, ISubscription, IMessage } from '@rocket.chat/core-typings';

import JumpToMessageAction from './actions/JumpToMessageAction';

type DirectItemsProps = {
	message: IMessage;
	room: IRoom;
	subscription: ISubscription | undefined;
};

const DirectItems = ({ message, subscription }: DirectItemsProps) => {
	return <>{!!subscription && <JumpToMessageAction id='jump-to-pin-message' message={message} />}</>;
};

export default DirectItems;

import type { IRoom, ISubscription, IMessage } from '@rocket.chat/core-typings';

import JumpToMessageAction from './actions/JumpToMessageAction';

type SearchItemsProps = {
	message: IMessage;
	room: IRoom;
	subscription: ISubscription | undefined;
};

const SearchItems = ({ message }: SearchItemsProps) => {
	return (
		<>
			<JumpToMessageAction id='jump-to-message' message={message} />
		</>
	);
};

export default SearchItems;

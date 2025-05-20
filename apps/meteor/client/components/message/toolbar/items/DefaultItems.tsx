import type { IRoom, ISubscription, IMessage } from '@rocket.chat/core-typings';

import ForwardMessageAction from './actions/ForwardMessageAction';
import QuoteMessageAction from './actions/QuoteMessageAction';
import ReactionMessageAction from './actions/ReactionMessageAction';
import ReplyInThreadMessageAction from './actions/ReplyInThreadMessageAction';
// Import the TimestampButton component
import TimestampButton from './actions/Timestamp/TimestampButton';
import { FeaturePreview, FeaturePreviewOn} from '@rocket.chat/ui-client';

type DefaultItemsProps = {
	message: IMessage;
	room: IRoom;
	subscription: ISubscription | undefined;
};

const DefaultItems = ({ message, room, subscription }: DefaultItemsProps) => {
	return (
		<>
			<ReactionMessageAction message={message} room={room} subscription={subscription} />
			<QuoteMessageAction message={message} subscription={subscription} />
			<ReplyInThreadMessageAction message={message} room={room} subscription={subscription} />
			<ForwardMessageAction message={message} />
			// Add the component to the existing toolbar items
			<FeaturePreview feature="enable-timestamp-message-parser">
				{[
					<FeaturePreviewOn>
						<TimestampButton message={message} />
					</FeaturePreviewOn>,
				]}
			</FeaturePreview>

		</>
	);
};

export default DefaultItems;

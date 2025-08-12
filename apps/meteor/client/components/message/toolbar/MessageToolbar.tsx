import { useToolbar } from '@react-aria/toolbar';
import type { IMessage, IRoom, ISubscription, ITranslatedMessage } from '@rocket.chat/core-typings';
import { isThreadMessage, isRoomFederated, isVideoConfMessage } from '@rocket.chat/core-typings';
import { MessageToolbar as FuselageMessageToolbar } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ElementType, ReactElement } from 'react';
import { memo, useRef } from 'react';

import MessageToolbarActionMenu from './MessageToolbarActionMenu';
import MessageToolbarStarsActionMenu from './MessageToolbarStarsActionMenu';
import DefaultItems from './items/DefaultItems';
import DirectItems from './items/DirectItems';
import FederatedItems from './items/FederatedItems';
import MentionsItems from './items/MentionsItems';
import MobileItems from './items/MobileItems';
import PinnedItems from './items/PinnedItems';
import SearchItems from './items/SearchItems';
import StarredItems from './items/StarredItems';
import ThreadsItems from './items/ThreadsItems';
import VideoconfItems from './items/VideoconfItems';
import VideoconfThreadsItems from './items/VideoconfThreadsItems';
import type { MessageActionContext } from '../../../../app/ui-utils/client/lib/MessageAction';

const getMessageContext = (message: IMessage, room: IRoom, context?: MessageActionContext): MessageActionContext => {
	if (context) {
		return context;
	}

	if (isVideoConfMessage(message)) {
		return 'videoconf';
	}

	if (isRoomFederated(room)) {
		return 'federated';
	}

	if (isThreadMessage(message)) {
		return 'threads';
	}

	return 'message';
};

const itemsByContext: Record<
	MessageActionContext,
	ElementType<{ message: IMessage; room: IRoom; subscription: ISubscription | undefined }>
> = {
	'message': DefaultItems,
	'message-mobile': MobileItems,
	'threads': ThreadsItems,
	'videoconf': VideoconfItems,
	'videoconf-threads': VideoconfThreadsItems,
	'pinned': PinnedItems,
	'direct': DirectItems,
	'starred': StarredItems,
	'mentions': MentionsItems,
	'federated': FederatedItems,
	'search': SearchItems,
};

type MessageToolbarProps = {
	message: IMessage & Partial<ITranslatedMessage>;
	messageContext?: MessageActionContext;
	room: IRoom;
	subscription?: ISubscription;
	onChangeMenuVisibility: (visible: boolean) => void;
} & ComponentProps<typeof FuselageMessageToolbar>;

const MessageToolbar = ({
	message,
	messageContext,
	room,
	subscription,
	onChangeMenuVisibility,
	...props
}: MessageToolbarProps): ReactElement | null => {
	const t = useTranslation();

	const toolbarRef = useRef(null);
	const { toolbarProps } = useToolbar(props, toolbarRef);

	const context = getMessageContext(message, room, messageContext);

	const MessageToolbarItems = itemsByContext[context];

	return (
		<FuselageMessageToolbar ref={toolbarRef} {...toolbarProps} aria-label={t('Message_actions')} {...props}>
			<MessageToolbarItems message={message} room={room} subscription={subscription} />
			<MessageToolbarStarsActionMenu message={message} context={context} onChangeMenuVisibility={onChangeMenuVisibility} />
			<MessageToolbarActionMenu
				message={message}
				context={context}
				room={room}
				subscription={subscription}
				onChangeMenuVisibility={onChangeMenuVisibility}
			/>
		</FuselageMessageToolbar>
	);
};

export default memo(MessageToolbar);

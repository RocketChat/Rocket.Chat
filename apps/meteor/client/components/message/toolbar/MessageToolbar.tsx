import { useToolbar } from '@react-aria/toolbar';
import type { IMessage, IRoom, ISubscription, ITranslatedMessage } from '@rocket.chat/core-typings';
import { isThreadMessage, isRoomFederated, isVideoConfMessage } from '@rocket.chat/core-typings';
import { MessageToolbar as FuselageMessageToolbar } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ElementType, ReactElement } from 'react';
import { memo, useRef, useState, useEffect } from 'react';

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

let isGlobalShiftDown = false;
if (typeof window !== 'undefined') {
	const handleDocumentKeyDown = (e: KeyboardEvent): void => {
		if (e.key === 'Shift') {
			isGlobalShiftDown = true;
		}
	};
	const handleDocumentKeyUp = (e: KeyboardEvent): void => {
		if (e.key === 'Shift') {
			isGlobalShiftDown = false;
		}
	};
	const handleWindowBlur = (): void => {
		isGlobalShiftDown = false;
	};

	document.addEventListener('keydown', handleDocumentKeyDown);
	document.addEventListener('keyup', handleDocumentKeyUp);
	window.addEventListener('blur', handleWindowBlur);
	window.addEventListener('unload', () => {
		document.removeEventListener('keydown', handleDocumentKeyDown);
		document.removeEventListener('keyup', handleDocumentKeyUp);
		window.removeEventListener('blur', handleWindowBlur);
	});
}

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
	const [isHovered, setIsHovered] = useState(false);
	const [shiftPressed, setShiftPressed] = useState(() => isGlobalShiftDown);

	const toolbarRef = useRef<HTMLDivElement>(null);
	const { toolbarProps } = useToolbar(props, toolbarRef);

	useEffect(() => {
		const messageElement = toolbarRef.current?.closest('[data-qa-type="message"]') as HTMLElement | null;
		if (!messageElement) {
			return;
		}

		// Check if we are already hovering the message when component mounts
		if (messageElement.matches(':hover')) {
			setIsHovered(true);
		}

		const handleMouseEnter = (e: MouseEvent) => {
			setShiftPressed(e.shiftKey);
			setIsHovered(true);
		};

		const handleMouseLeave = () => {
			setIsHovered(false);
			setShiftPressed(false);
		};

		// Robustly track shift state during movement to catch edge cases (missed enter, or holding before hover)
		const handleMouseMove = (e: MouseEvent) => {
			setShiftPressed((prev) => (prev === e.shiftKey ? prev : e.shiftKey));
		};

		messageElement.addEventListener('mouseenter', handleMouseEnter);
		messageElement.addEventListener('mouseleave', handleMouseLeave);
		messageElement.addEventListener('mousemove', handleMouseMove);

		return () => {
			messageElement.removeEventListener('mouseenter', handleMouseEnter);
			messageElement.removeEventListener('mouseleave', handleMouseLeave);
			messageElement.removeEventListener('mousemove', handleMouseMove);
		};
	}, []);

	useEffect(() => {
		if (!isHovered) {
			return;
		}
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Shift') {
				setShiftPressed(true);
			}
		};
		const handleKeyUp = (e: KeyboardEvent) => {
			if (e.key === 'Shift') {
				setShiftPressed(false);
			}
		};
		document.addEventListener('keydown', handleKeyDown);
		document.addEventListener('keyup', handleKeyUp);
		return () => {
			document.removeEventListener('keydown', handleKeyDown);
			document.removeEventListener('keyup', handleKeyUp);
		};
	}, [isHovered]);

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
				expanded={shiftPressed}
			/>
		</FuselageMessageToolbar>
	);
};

export default memo(MessageToolbar);

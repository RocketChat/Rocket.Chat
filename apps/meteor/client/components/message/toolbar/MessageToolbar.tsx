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
import DeleteMessageAction from './items/actions/DeleteMessageAction';
import PermalinkMessageAction from './items/actions/PermalinkMessageAction';
import type { MessageActionContext } from '../../../../app/ui-utils/client/lib/MessageAction';

// Track the latest Shift-pressed state at module level so newly mounted toolbars
// can reflect it immediately, even if Shift was held before hover/render.
let __rcLatestShiftPressed = false;
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
	const onKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Shift') {
			__rcLatestShiftPressed = true;
		}
	};
	const onKeyUp = (e: KeyboardEvent) => {
		if (e.key === 'Shift') {
			__rcLatestShiftPressed = false;
		}
	};
	// Attach once per module evaluation; in dev HMR this might attach more than once,
	// but the handlers are idempotent and cheap.
	window.addEventListener('keydown', onKeyDown);
	window.addEventListener('keyup', onKeyUp);
}

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
	const [isShiftPressed, setIsShiftPressed] = useState<boolean>(__rcLatestShiftPressed);

	const toolbarRef = useRef(null);
	const { toolbarProps } = useToolbar(props, toolbarRef);

	const context = getMessageContext(message, room, messageContext);

	const MessageToolbarItems = itemsByContext[context];

	// Handle Shift detection even if held before hover (keydown/keyup + pointer movement/enter)
	useEffect(() => {
		// Sync immediately from the module-level snapshot on mount so the icon shows right away
		setIsShiftPressed(__rcLatestShiftPressed);
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Shift') {
				__rcLatestShiftPressed = true;
				setIsShiftPressed(true);
			}
		};

		const handleKeyUp = (event: KeyboardEvent) => {
			if (event.key === 'Shift') {
				__rcLatestShiftPressed = false;
				setIsShiftPressed(false);
			}
		};

		const handlePointerMove = (event: PointerEvent) => {
			// Reflect current Shift state while moving the pointer
			__rcLatestShiftPressed = event.shiftKey;
			setIsShiftPressed(event.shiftKey);
		};

		const handleMouseEnter = (event: MouseEvent) => {
			// If user is already holding Shift when entering the toolbar area
			__rcLatestShiftPressed = event.shiftKey;
			setIsShiftPressed(event.shiftKey);
		};

		// Listen for global key and pointer state changes
		document.addEventListener('keydown', handleKeyDown);
		document.addEventListener('keyup', handleKeyUp);
		document.addEventListener('pointermove', handlePointerMove);

		// Best-effort: when entering the toolbar, sync Shift state
		const el = toolbarRef.current as HTMLElement | null;
		el?.addEventListener('mouseenter', handleMouseEnter);

		return () => {
			document.removeEventListener('keydown', handleKeyDown);
			document.removeEventListener('keyup', handleKeyUp);
			document.removeEventListener('pointermove', handlePointerMove);
			el?.removeEventListener('mouseenter', handleMouseEnter);
		};
	}, []);

	return (
		<FuselageMessageToolbar ref={toolbarRef} {...toolbarProps} aria-label={t('Message_actions')} {...props}>
			<MessageToolbarItems message={message} room={room} subscription={subscription} />
			{isShiftPressed && <PermalinkMessageAction message={message} room={room} subscription={subscription} />}
			{isShiftPressed && <DeleteMessageAction message={message} room={room} subscription={subscription} />}
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

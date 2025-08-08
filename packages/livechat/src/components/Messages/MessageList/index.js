import { parseISO, isSameDay } from 'date-fns';
import { Suspense } from 'preact/compat';

import { getAttachmentUrl } from '../../../helpers/baseUrl';
import { createClassName } from '../../../helpers/createClassName';
import constants from '../../../lib/constants';
import store from '../../../store';
import { isCallOngoing } from '../../Calls/CallStatus';
import { JoinCallButton } from '../../Calls/JoinCallButton';
import Message from '../Message';
import MessageSeparator from '../MessageSeparator';
import { TypingIndicator } from '../TypingIndicator';
import styles from './styles.scss';
import { useEffect, useRef, useState, useCallback } from 'preact/hooks';

export const MessageList = ({
	typingUsernames = [],
	onScrollTo,
	handleEmojiClick,
	messages,
	uid,
	dispatch,
	hideSenderAvatar = false,
	hideReceiverAvatar = false,
	lastReadMessageId,
	conversationFinishedMessage,
	attachmentResolver = getAttachmentUrl,
	avatarResolver,
	className,
	style = {},
}) => {
	const SCROLL_AT_TOP = 'top';
	const SCROLL_AT_BOTTOM = 'bottom';
	const SCROLL_FREE = 'free';

	const [scrollPosition, setScrollPosition] = useState(SCROLL_AT_BOTTOM);
	const baseRef = useRef(null);
	const lastMessageRef = useRef(null);
	const previousScrollHeightRef = useRef(null);
	const isResizingFromBottomRef = useRef(false);

	const handleScroll = useCallback(() => {
		if (isResizingFromBottomRef.current) {
			baseRef.current.scrollTop = baseRef.current.scrollHeight;
			isResizingFromBottomRef.current = false;
			return;
		}

		let newScrollPosition;
		const scrollBottom = baseRef.current.scrollHeight - (baseRef.current.clientHeight + baseRef.current.scrollTop);

		if (baseRef.current.scrollHeight <= baseRef.current.clientHeight) {
			newScrollPosition = SCROLL_AT_BOTTOM;
		} else if (baseRef.current.scrollTop === 0) {
			newScrollPosition = SCROLL_AT_TOP;
		} else if (scrollBottom <= 0) {
			newScrollPosition = SCROLL_AT_BOTTOM;
		} else {
			newScrollPosition = SCROLL_FREE;
		}

		if (scrollPosition !== newScrollPosition) {
			setScrollPosition(newScrollPosition);
			onScrollTo && onScrollTo(newScrollPosition);
		}

		const { messageListPosition } = store.state;

		if (messageListPosition !== newScrollPosition) {
			dispatch({ messageListPosition: newScrollPosition });
		}
	}, [scrollPosition, onScrollTo, dispatch]);

	const checkIfLastMessageInView = useCallback((entries) => {
		const entry = entries[0];
		const isInView = entry.isIntersecting;
	}, []);

	useEffect(() => {
		const observer = new IntersectionObserver(checkIfLastMessageInView, {
			root: baseRef.current,
			threshold: 1.0,
		});

		if (lastMessageRef.current) {
			observer.observe(lastMessageRef.current);
		}

		return () => {
			if (lastMessageRef.current) {
				observer.unobserve(lastMessageRef.current);
			}
		};
	}, [messages, checkIfLastMessageInView]);

	const handleResize = useCallback(() => {
		if (scrollPosition === SCROLL_AT_BOTTOM) {
			baseRef.current.scrollTop = baseRef.current.scrollHeight;
			isResizingFromBottomRef.current = true;
			return;
		}

		if (baseRef.current.scrollHeight <= baseRef.current.clientHeight) {
			setScrollPosition(SCROLL_AT_BOTTOM);
			onScrollTo && onScrollTo(SCROLL_AT_BOTTOM);
		}
	}, [scrollPosition, onScrollTo]);

	const handleClick = useCallback(() => {
		handleEmojiClick && handleEmojiClick();
	}, [handleEmojiClick]);

	useEffect(() => {
		handleResize();
		window.addEventListener('resize', handleResize);
		return () => {
			window.removeEventListener('resize', handleResize);
		};
	}, [handleResize]);

	useEffect(() => {
		if (scrollPosition === SCROLL_AT_TOP) {
			previousScrollHeightRef.current = baseRef.current.scrollHeight;
		}
	});

	useEffect(() => {
		if (messages?.length !== prevMessages?.length) {
			const lastMessage = messages[messages.length - 1];

			if (lastMessage?.u?._id && lastMessage.u._id === uid) {
				setScrollPosition(SCROLL_AT_BOTTOM);
			}
		}

		if (scrollPosition === SCROLL_AT_BOTTOM) {
			baseRef.current.scrollTop = baseRef.current.scrollHeight;
			return;
		}

		if (scrollPosition === SCROLL_AT_TOP) {
			const delta = baseRef.current.scrollHeight - previousScrollHeightRef.current;
			if (delta > 0) {
				baseRef.current.scrollTop = delta;
			}
			previousScrollHeightRef.current = null;
		}
	}, [messages, uid, scrollPosition]);

	const isVideoConfMessage = (message) => {
		return Boolean(
			message.blocks
				?.find(({ appId, type }) => appId === 'videoconf-core' && type === 'actions')
				?.elements?.find(({ actionId }) => actionId === 'joinLivechat'),
		);
	};

	const renderItems = () => {
		const items = [];
		const { incomingCallAlert, ongoingCall } = store.state;

		for (let i = 0; i < messages.length; ++i) {
			const previousMessage = messages[i - 1];
			const message = messages[i];
			const nextMessage = messages[i + 1];

			if (
				message.t === constants.webRTCCallStartedMessageType &&
				message.actionLinks &&
				message.actionLinks.length &&
				ongoingCall &&
				isCallOngoing(ongoingCall.callStatus) &&
				!message.webRtcCallEndTs
			) {
				const { url, callProvider, rid } = incomingCallAlert || {};
				items.push(<JoinCallButton callStatus={ongoingCall.callStatus} url={url} callProvider={callProvider} rid={rid} />);
				continue;
			}

			const videoConfJoinBlock = message.blocks
				?.find(({ appId, type }) => appId === 'videoconf-core' && type === 'actions')
				?.elements?.find(({ actionId }) => actionId === 'joinLivechat');
			if (videoConfJoinBlock) {
				// If the call is not accepted yet, don't render the message.
				if (!ongoingCall || !isCallOngoing(ongoingCall.callStatus)) {
					continue;
				}
			}

			const showDateSeparator = !previousMessage || !isSameDay(parseISO(message.ts), parseISO(previousMessage.ts));
			if (showDateSeparator) {
				items.push(<MessageSeparator key={`sep-${message.ts}`} use='li' date={message.ts} />);
			}

			const isMe = uid && message.u && uid === message.u._id;
			items.push(
				<Suspense fallback={null}>
					<Message
						key={message._id}
						attachmentResolver={attachmentResolver}
						avatarResolver={avatarResolver}
						use='li'
						me={isMe}
						hideAvatar={(isMe && hideSenderAvatar) || (!isMe && hideReceiverAvatar)}
						compact={nextMessage && message.u && nextMessage.u && message.u._id === nextMessage.u._id && !nextMessage.t}
						conversationFinishedMessage={conversationFinishedMessage}
						type={message.t}
						{...message}
					/>
				</Suspense>,
			);

			const showUnreadSeparator = lastReadMessageId && nextMessage && lastReadMessageId === message._id;
			if (showUnreadSeparator) {
				items.push(<MessageSeparator key='unread' use='li' unread />);
			}
		}

		if (typingUsernames && typingUsernames.length) {
			items.push(<TypingIndicator key='typing' use='li' avatarResolver={avatarResolver} usernames={typingUsernames} />);
		}

		return items;
	};

	return (
		<div
			onScroll={handleScroll}
			className={createClassName(styles, 'message-list', {}, [className])}
			onClick={handleClick}
			style={style}
			data-qa='message-list'
			ref={baseRef}
		>
			<ol className={createClassName(styles, 'message-list__content')}>{renderItems()}</ol>
		</div>
	);
};

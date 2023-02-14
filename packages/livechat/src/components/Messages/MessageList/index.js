import { parseISO } from 'date-fns/fp';
import isSameDay from 'date-fns/isSameDay';

import constants from '../../../lib/constants';
import store from '../../../store';
import { isCallOngoing } from '../../Calls/CallStatus';
import { JoinCallButton } from '../../Calls/JoinCallButton';
import { createClassName, getAttachmentUrl, MemoizedComponent } from '../../helpers';
import Message from '../Message';
import MessageSeparator from '../MessageSeparator';
import { TypingIndicator } from '../TypingIndicator';
import styles from './styles.scss';

export class MessageList extends MemoizedComponent {
	static defaultProps = {
		typingUsernames: [],
	};

	static SCROLL_AT_TOP = 'top';

	static SCROLL_AT_BOTTOM = 'bottom';

	static SCROLL_FREE = 'free';

	// eslint-disable-next-line no-use-before-define
	scrollPosition = MessageList.SCROLL_AT_BOTTOM;

	handleScroll = () => {
		if (this.isResizingFromBottom) {
			this.base.scrollTop = this.base.scrollHeight;
			delete this.isResizingFromBottom;
			return;
		}

		let scrollPosition;
		if (this.base.scrollHeight <= this.base.clientHeight) {
			scrollPosition = MessageList.SCROLL_AT_BOTTOM;
		} else if (this.base.scrollTop === 0) {
			scrollPosition = MessageList.SCROLL_AT_TOP;
		} else if (this.base.scrollHeight === this.base.scrollTop + this.base.clientHeight) {
			scrollPosition = MessageList.SCROLL_AT_BOTTOM;
		} else {
			scrollPosition = MessageList.SCROLL_FREE;
		}

		if (this.scrollPosition !== scrollPosition) {
			this.scrollPosition = scrollPosition;
			const { onScrollTo } = this.props;
			onScrollTo && onScrollTo(scrollPosition);
		}
	};

	handleResize = () => {
		if (this.scrollPosition === MessageList.SCROLL_AT_BOTTOM) {
			this.base.scrollTop = this.base.scrollHeight;
			this.isResizingFromBottom = true;
			return;
		}

		if (this.base.scrollHeight <= this.base.clientHeight) {
			const { onScrollTo } = this.props;
			this.scrollPosition = MessageList.SCROLL_AT_BOTTOM;
			onScrollTo && onScrollTo(MessageList.SCROLL_AT_BOTTOM);
		}
	};

	handleClick = () => {
		const { handleEmojiClick } = this.props;
		handleEmojiClick && handleEmojiClick();
	};

	componentWillUpdate() {
		if (this.scrollPosition === MessageList.SCROLL_AT_TOP) {
			this.previousScrollHeight = this.base.scrollHeight;
		}
	}

	componentDidUpdate() {
		if (this.scrollPosition === MessageList.SCROLL_AT_BOTTOM) {
			this.base.scrollTop = this.base.scrollHeight;
			return;
		}

		if (this.scrollPosition === MessageList.SCROLL_AT_TOP) {
			const delta = this.base.scrollHeight - this.previousScrollHeight;
			if (delta > 0) {
				this.base.scrollTop = delta;
			}
			delete this.previousScrollHeight;
		}
	}

	componentDidMount() {
		this.handleResize();
		window.addEventListener('resize', this.handleResize);
	}

	componentWillUnmount() {
		window.removeEventListener('resize', this.handleResize);
	}

	isVideoConfMessage(message) {
		return Boolean(
			message.blocks
				?.find(({ appId, type }) => appId === 'videoconf-core' && type === 'actions')
				?.elements?.find(({ actionId }) => actionId === 'joinLivechat'),
		);
	}

	renderItems = ({
		attachmentResolver = getAttachmentUrl,
		avatarResolver,
		messages,
		lastReadMessageId,
		uid,
		conversationFinishedMessage,
		typingUsernames,
	}) => {
		const items = [];
		const { incomingCallAlert } = store.state;
		const { ongoingCall } = store.state;

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

			items.push(
				<Message
					key={message._id}
					attachmentResolver={attachmentResolver}
					avatarResolver={avatarResolver}
					use='li'
					me={uid && message.u && uid === message.u._id}
					compact={nextMessage && message.u && nextMessage.u && message.u._id === nextMessage.u._id && !nextMessage.t}
					conversationFinishedMessage={conversationFinishedMessage}
					type={message.t}
					{...message}
				/>,
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

	render = ({ className, style = {} }) => (
		<div
			onScroll={this.handleScroll}
			className={createClassName(styles, 'message-list', {}, [className])}
			onClick={this.handleClick}
			style={style}
		>
			<ol className={createClassName(styles, 'message-list__content')}>{this.renderItems(this.props)}</ol>
		</div>
	);
}

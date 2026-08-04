import { parseISO, isSameDay } from 'date-fns';
import i18next from 'i18next';
import type { VNode } from 'preact';
import type { CSSProperties } from 'preact/compat';
import { Suspense } from 'preact/compat';

import { MemoizedComponent } from '../../../helpers/MemoizedComponent';
import { getAttachmentUrl } from '../../../helpers/baseUrl';
import { createClassName } from '../../../helpers/createClassName';
import type { Dispatch } from '../../../store';
import store from '../../../store';
import Message from '../Message';
import MessageSeparator from '../MessageSeparator';
import { TypingIndicator } from '../TypingIndicator';
import styles from './styles.scss';

type ScrollPosition = 'top' | 'bottom' | 'free';

type MessageListProps = {
	messages: any[];
	uid?: string | number;
	avatarResolver?: (username: string) => string | undefined;
	attachmentResolver?: (url: string) => string;
	conversationFinishedMessage?: string;
	lastReadMessageId?: string | number;
	typingUsernames?: string[];
	hideSenderAvatar?: boolean;
	hideReceiverAvatar?: boolean;
	onScrollTo?: (position: ScrollPosition) => void;
	handleEmojiClick?: () => void;
	dispatch?: Dispatch;
	className?: string;
	style?: CSSProperties;
	[key: string]: unknown;
};

export class MessageList extends MemoizedComponent<MessageListProps, unknown> {
	static override defaultProps = {
		typingUsernames: [],
	};

	static readonly SCROLL_AT_TOP = 'top';

	static readonly SCROLL_AT_BOTTOM = 'bottom';

	static readonly SCROLL_FREE = 'free';

	static readonly SCROLL_AT_BOTTOM_AREA = 128;

	scrollPosition: ScrollPosition = MessageList.SCROLL_AT_BOTTOM;

	isResizingFromBottom?: boolean;

	previousScrollHeight?: number;

	handleScroll = () => {
		const base = this.base as HTMLElement;

		if (this.isResizingFromBottom) {
			base.scrollTop = base.scrollHeight;
			delete this.isResizingFromBottom;
			return;
		}

		let scrollPosition: ScrollPosition;
		const scrollBottom = base.scrollHeight - (base.clientHeight + base.scrollTop);

		if (base.scrollHeight <= base.clientHeight) {
			scrollPosition = MessageList.SCROLL_AT_BOTTOM;
		} else if (base.scrollTop === 0) {
			scrollPosition = MessageList.SCROLL_AT_TOP;
		} else if (scrollBottom <= MessageList.SCROLL_AT_BOTTOM_AREA) {
			// TODO: Once we convert these classes to functional components we should use refs to check if the last message is within the viewport
			// For now we are using a fixed value to check if the last message is within the bottom of the scroll area
			scrollPosition = MessageList.SCROLL_AT_BOTTOM;
		} else {
			scrollPosition = MessageList.SCROLL_FREE;
		}

		if (this.scrollPosition !== scrollPosition) {
			this.scrollPosition = scrollPosition;
			const { onScrollTo } = this.props;
			onScrollTo && onScrollTo(scrollPosition);
		}

		const { dispatch } = this.props;
		const { messageListPosition } = store.state;

		if (messageListPosition !== this.scrollPosition) {
			dispatch?.({ messageListPosition: this.scrollPosition });
		}
	};

	handleResize = () => {
		const base = this.base as HTMLElement;

		if (this.scrollPosition === MessageList.SCROLL_AT_BOTTOM) {
			base.scrollTop = base.scrollHeight;
			this.isResizingFromBottom = true;
			return;
		}

		if (base.scrollHeight <= base.clientHeight) {
			const { onScrollTo } = this.props;
			this.scrollPosition = MessageList.SCROLL_AT_BOTTOM;
			onScrollTo && onScrollTo(MessageList.SCROLL_AT_BOTTOM);
		}
	};

	handleClick = () => {
		const { handleEmojiClick } = this.props;
		handleEmojiClick && handleEmojiClick();
	};

	override componentWillUpdate() {
		if (this.scrollPosition === MessageList.SCROLL_AT_TOP) {
			this.previousScrollHeight = (this.base as HTMLElement).scrollHeight;
		}
	}

	override componentDidUpdate(prevProps: MessageListProps) {
		const base = this.base as HTMLElement;
		const { messages, uid } = this.props;
		const { messages: prevMessages } = prevProps;

		if (messages?.length !== prevMessages?.length) {
			const lastMessage = messages[messages.length - 1];

			if (lastMessage?.u?._id && lastMessage.u._id === uid) {
				this.scrollPosition = MessageList.SCROLL_AT_BOTTOM;
			}
		}

		if (this.scrollPosition === MessageList.SCROLL_AT_BOTTOM) {
			base.scrollTop = base.scrollHeight;
			return;
		}

		if (this.scrollPosition === MessageList.SCROLL_AT_TOP) {
			const delta = base.scrollHeight - (this.previousScrollHeight ?? 0);
			if (delta > 0) {
				base.scrollTop = delta;
			}
			delete this.previousScrollHeight;
		}
	}

	override componentDidMount() {
		this.handleResize();
		window.addEventListener('resize', this.handleResize);
	}

	override componentWillUnmount() {
		window.removeEventListener('resize', this.handleResize);
	}

	isVideoConfMessage(message: any) {
		return Boolean(
			message.blocks
				?.find(({ appId, type }: any) => appId === 'videoconf-core' && type === 'actions')
				?.elements?.find(({ actionId }: any) => actionId === 'joinLivechat'),
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
	}: MessageListProps) => {
		const items: VNode[] = [];
		const { hideSenderAvatar = false, hideReceiverAvatar = false } = this.props || {};

		for (let i = 0; i < messages.length; ++i) {
			const previousMessage = messages[i - 1];
			const message = messages[i];
			const nextMessage = messages[i + 1];
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
			const indicatorLabel = `${typingUsernames.join(', ')} ${typingUsernames.length > 1 ? i18next.t('are_typing') : i18next.t('is_typing')}`;
			items.push(
				<TypingIndicator
					key='typing'
					use='li'
					avatarResolver={avatarResolver ?? (() => undefined)}
					usernames={typingUsernames}
					text={indicatorLabel}
				/>,
			);
		}

		return items;
	};

	render = ({ className, style = {} }: MessageListProps) => (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
		<div
			data-qa='message-list'
			className={createClassName(styles, 'message-list', {}, [className])}
			style={style}
			onClick={this.handleClick}
			onScroll={this.handleScroll}
		>
			<ol className={createClassName(styles, 'message-list__content')}>{this.renderItems(this.props)}</ol>
		</div>
	);
}

import { Component } from 'preact';

import { canRenderMessage } from '../../helpers/canRenderMessage';
import constants from '../../lib/constants';
import { getLastReadMessage, processUnread, shouldMarkAsUnread } from '../../lib/main';
import { loadMessages } from '../../lib/room';
import type { Dispatch, StoreState } from '../../store';

export type ChatContainerProps = {
	user?: StoreState['user'];
	messages?: StoreState['messages'];
	dispatch: Dispatch;
	alerts: StoreState['alerts'];
	checkRoom: () => void;
	handleConnectingAgentAlert: (connecting: boolean, message?: string | false) => Promise<void>;
	checkConnectingAgent: () => Promise<void>;
};

class ChatContainer extends Component<ChatContainerProps> {
	override async componentDidMount() {
		const { checkConnectingAgent } = this.props;

		await checkConnectingAgent();
		await loadMessages();
		void processUnread();
	}

	override componentWillUnmount() {
		const { handleConnectingAgentAlert } = this.props;

		void handleConnectingAgentAlert(false);
	}

	override async componentDidUpdate({ messages: prevMessages, alerts: prevAlerts }: ChatContainerProps) {
		const { messages, checkConnectingAgent, dispatch, user, checkRoom } = this.props;

		const renderedMessages = (messages ?? []).filter((message) => canRenderMessage(message));
		const lastRenderedMessage = renderedMessages[renderedMessages.length - 1];
		const prevRenderedMessages = (prevMessages ?? []).filter((message) => canRenderMessage(message));

		const shouldMarkUnread = shouldMarkAsUnread();

		if (
			(lastRenderedMessage && lastRenderedMessage.u?._id === user?._id) ||
			(!shouldMarkUnread && renderedMessages?.length !== prevRenderedMessages?.length)
		) {
			const nextLastMessage = lastRenderedMessage;
			const lastReadMessage = getLastReadMessage();

			if (nextLastMessage && nextLastMessage._id !== lastReadMessage?._id) {
				const newAlerts = prevAlerts.filter((item) => item.id !== constants.unreadMessagesAlertId);
				dispatch({ alerts: newAlerts, unread: null, lastReadMessageId: nextLastMessage._id });
			}
		}

		await checkConnectingAgent();
		checkRoom();
	}

	render = () => null;
}

export default ChatContainer;

import type { TFunction } from 'i18next';
import type { RefObject } from 'preact';
import { Component } from 'preact';
import type { MutableRef } from 'preact/hooks';

import Chat from './component';
import type { ScreenContextValue } from '../../components/Screen/ScreenProvider';
import { getAvatarUrl } from '../../helpers/baseUrl';
import { canRenderMessage } from '../../helpers/canRenderMessage';
import constants from '../../lib/constants';
import { getLastReadMessage, processUnread, shouldMarkAsUnread } from '../../lib/main';
import { loadMessages } from '../../lib/room';
import type { Dispatch, StoreState } from '../../store';

export type ChatContainerProps = {
	innerStateRef: MutableRef<{
		room: StoreState['room'] | null;
		connectingAgent: boolean;
		queueSpot: number;
		triggerQueueMessage: boolean;
		estimatedWaitTime: number | null | undefined;
	}>;
	inputRef: RefObject<HTMLInputElement>;
	notifyEmojiSelectRef: MutableRef<((native: string) => void) | undefined>;
	title?: string;
	sound: StoreState['sound'];
	token: StoreState['token'];
	user?: StoreState['user'];
	agent?: StoreState['agent'];
	room?: StoreState['room'];
	messages?: StoreState['messages'];
	uploads?: boolean;
	typingUsernames?: string[];
	loading?: boolean;
	connecting?: boolean;
	dispatch: Dispatch;
	departments?: StoreState['config']['departments'];
	allowSwitchingDepartments?: boolean;
	conversationFinishedMessage?: string;
	allowRemoveUserData?: boolean;
	alerts: StoreState['alerts'];
	unread?: StoreState['unread'];
	lastReadMessageId?: StoreState['lastReadMessageId'];
	guest?: StoreState['iframe']['guest'];
	queueInfo?: StoreState['queueInfo'];
	registrationFormEnabled?: boolean;
	nameFieldRegistrationForm?: boolean;
	emailFieldRegistrationForm?: boolean;
	limitTextLength?: number;
	theme: ScreenContextValue['theme'];
	visitorsCanCloseChat?: boolean;
	t: TFunction;
	onRegisterUser: () => void;
	handleChangeDepartment: () => void;
	checkRoom: () => void;
	grantUser: () => Promise<void>;
	getRoom: () => Promise<{
		_id: string;
		servedBy?: unknown;
	}>;
	onTop: () => void;
	startTyping: ({ rid, username }: { rid: string; username: string }) => void;
	stopTyping: ({ rid, username }: { rid: string; username: string }) => Promise<any> & {
		id: string;
	};
	stopTypingDebounced: {
		({ rid, username }: { rid: string; username: string }): unknown;
		stop: () => void;
	};
	onChangeText: () => Promise<void>;
	onSubmit: (msg: string) => Promise<void>;
	doFileUpload: (rid: string, file: File) => Promise<void>;
	onUpload: (files: (File | null)[]) => Promise<void>;
	onSoundStop: () => Promise<void>;
	handleFinishChat: () => Promise<void>;
	handleRemoveUserData: () => Promise<void>;
	canSwitchDepartment: boolean;
	canFinishChat: boolean;
	canRemoveUserData: boolean;
	handleConnectingAgentAlert: (connecting: boolean, message?: string | false) => Promise<void>;
	handleQueueMessage: (
		connecting: boolean,
		queueInfo?: {
			spot?: number | undefined;
			estimatedWaitTimeSeconds?: number | undefined;
			message?:
				| {
						text?: string | undefined;
						user?: unknown;
				  }
				| undefined;
		},
	) => Promise<void>;
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

	render = ({
		inputRef,
		notifyEmojiSelectRef,
		title,
		user,
		onRegisterUser,
		handleChangeDepartment,
		dispatch,
		t,
		theme,
		agent,
		conversationFinishedMessage,
		lastReadMessageId,
		limitTextLength,
		loading,
		messages,
		queueInfo,
		typingUsernames,
		unread,
		uploads,
		registrationFormEnabled,
		departments = [],
		nameFieldRegistrationForm,
		emailFieldRegistrationForm,
		onTop,
		onChangeText,
		onSubmit,
		onUpload,
		onSoundStop,
		handleFinishChat,
		handleRemoveUserData,
		canSwitchDepartment,
		canFinishChat,
		canRemoveUserData,
	}: ChatContainerProps) => {
		const avatarResolver = getAvatarUrl;

		const uid = user?._id;

		const options = canSwitchDepartment || canFinishChat || canRemoveUserData;

		const onChangeDepartment = canSwitchDepartment ? handleChangeDepartment : undefined;
		const onFinishChat = canFinishChat ? handleFinishChat : undefined;
		const onRemoveUserData = canRemoveUserData ? handleRemoveUserData : undefined;

		const registrationRequired = (() => {
			if (user?.token) {
				return false;
			}

			if (!registrationFormEnabled) {
				return false;
			}

			const showDepartment = departments.filter((dept) => dept.showOnRegistration).length > 0;
			return !!(nameFieldRegistrationForm || emailFieldRegistrationForm || showDepartment);
		})();

		return (
			<Chat
				inputRef={inputRef}
				notifyEmojiSelectRef={notifyEmojiSelectRef}
				title={title}
				dispatch={dispatch}
				t={t}
				theme={theme}
				agent={agent}
				conversationFinishedMessage={conversationFinishedMessage}
				lastReadMessageId={lastReadMessageId}
				limitTextLength={limitTextLength}
				loading={loading}
				messages={messages}
				queueInfo={queueInfo}
				typingUsernames={typingUsernames}
				unread={unread}
				uploads={uploads}
				avatarResolver={avatarResolver}
				uid={uid}
				onTop={onTop}
				onChangeText={onChangeText}
				onSubmit={onSubmit}
				onUpload={onUpload}
				options={options}
				onChangeDepartment={onChangeDepartment}
				onFinishChat={onFinishChat}
				onRemoveUserData={onRemoveUserData}
				onSoundStop={onSoundStop}
				registrationRequired={registrationRequired}
				onRegisterUser={onRegisterUser}
			/>
		);
	};
}

export default ChatContainer;

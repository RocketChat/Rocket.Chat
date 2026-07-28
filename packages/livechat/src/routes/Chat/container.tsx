import type { TFunction } from 'i18next';
import type { RefObject } from 'preact';
import { Component } from 'preact';
import type { MutableRef } from 'preact/hooks';
import { route } from 'preact-router';

import Chat from './component';
import { Livechat } from '../../api';
import { ModalManager } from '../../components/Modal';
import type { ScreenContextValue } from '../../components/Screen/ScreenProvider';
import { getAvatarUrl } from '../../helpers/baseUrl';
import { canRenderMessage } from '../../helpers/canRenderMessage';
import { debounce } from '../../helpers/debounce';
import { throttle } from '../../helpers/throttle';
import { upsert } from '../../helpers/upsert';
import { normalizeQueueAlert } from '../../lib/api';
import constants from '../../lib/constants';
import { getLastReadMessage, loadConfig, processUnread, shouldMarkAsUnread } from '../../lib/main';
import { parentCall, runCallbackEventEmitter } from '../../lib/parentCall';
import { createToken } from '../../lib/random';
import { initRoom, loadMessages, loadMoreMessages, defaultRoomParams, getGreetingMessages } from '../../lib/room';
import type { Dispatch, StoreState } from '../../store';
import store from '../../store';

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
	noMoreMessages?: boolean;
	emoji?: boolean;
	uploads?: boolean;
	typingUsernames?: string[];
	loading?: boolean;
	showConnecting?: boolean;
	connecting?: boolean;
	dispatch: Dispatch;
	departments?: StoreState['config']['departments'];
	allowSwitchingDepartments?: boolean;
	conversationFinishedMessage?: string;
	allowRemoveUserData?: boolean;
	alerts: StoreState['alerts'];
	visible?: boolean;
	unread?: StoreState['unread'];
	lastReadMessageId?: StoreState['lastReadMessageId'];
	guest?: StoreState['iframe']['guest'];
	triggerAgent?: StoreState['triggerAgent'];
	queueInfo?: StoreState['queueInfo'];
	registrationFormEnabled?: boolean;
	nameFieldRegistrationForm?: boolean;
	emailFieldRegistrationForm?: boolean;
	limitTextLength?: number;
	messageListPosition?: StoreState['messageListPosition'];
	theme: ScreenContextValue['theme'];
	visitorsCanCloseChat?: boolean;
	t: TFunction;
	onRegisterUser: () => void;
	handleChangeDepartment: () => void;
};

class ChatContainer extends Component<ChatContainerProps> {
	private checkConnectingAgent = async () => {
		const { connecting, queueInfo, innerStateRef } = this.props;
		const { handleQueueMessage, handleConnectingAgentAlert } = this;

		const { connectingAgent, queueSpot, estimatedWaitTime } = innerStateRef.current;

		const newConnecting = !!connecting;
		const newQueueSpot = queueInfo?.spot || 0;
		const newEstimatedWaitTime = queueInfo?.estimatedWaitTimeSeconds;

		if (newConnecting !== connectingAgent || newQueueSpot !== queueSpot || newEstimatedWaitTime !== estimatedWaitTime) {
			innerStateRef.current.connectingAgent = newConnecting;
			innerStateRef.current.queueSpot = newQueueSpot;
			innerStateRef.current.estimatedWaitTime = newEstimatedWaitTime;
			await handleQueueMessage(newConnecting, queueInfo);
			await handleConnectingAgentAlert(newConnecting, await normalizeQueueAlert(queueInfo));
		}
	};

	private checkRoom = () => {
		const { room, innerStateRef } = this.props;

		const { room: stateRoom } = innerStateRef.current;
		if (room && (!stateRoom || room._id !== stateRoom._id)) {
			innerStateRef.current.room = room;
			setTimeout(loadMessages, 500);
		}
	};

	private grantUser = async () => {
		const { token, user, guest, dispatch } = this.props;

		if (user) {
			return;
		}

		const {
			iframe: { defaultDepartment },
		} = store.state;

		if (!guest?.department && defaultDepartment && guest) {
			guest.department = defaultDepartment;
		}

		const visitor = { token, ...guest };
		const { visitor: newUser } = await Livechat.grantVisitor({ visitor });
		dispatch({ user: newUser });
	};

	private getRoom = async () => {
		const { alerts, dispatch, room, messages, t } = this.props;
		const previousMessages = getGreetingMessages(messages);

		if (room) {
			return room;
		}

		dispatch({ loading: true });
		try {
			const params = defaultRoomParams();
			const newRoom = await Livechat.room(params as Parameters<typeof Livechat.room>[0]);
			dispatch({ room: newRoom, messages: previousMessages, noMoreMessages: false });
			await initRoom();

			parentCall('callback', 'chat-started');
			return newRoom;
		} catch (error: any) {
			const reason = error ? error.error : '';
			const alert = {
				id: createToken(),
				children: t('error_starting_a_new_conversation_reason', { reason }),
				error: true,
				timeout: 10000,
			};
			dispatch({ loading: false, alerts: (alerts.push(alert), alerts) });

			runCallbackEventEmitter(reason, undefined);
			throw error;
		} finally {
			dispatch({ loading: false });
		}
	};

	private onTop = () => {
		void loadMoreMessages();
	};

	private startTyping = throttle(async ({ rid, username }: { rid: string; username: string }) => {
		await Livechat.notifyVisitorActivity(rid, username, ['user-typing']);
		this.stopTypingDebounced({ rid, username });
	}, 4500);

	private stopTyping = ({ rid, username }: { rid: string; username: string }) => Livechat.notifyVisitorActivity(rid, username, []);

	private stopTypingDebounced = debounce(this.stopTyping, 5000);

	private onChangeText = async () => {
		const { user, room } = this.props;
		if (!(user?.username && room?._id)) {
			return;
		}

		this.startTyping({ rid: room._id, username: user.username });
	};

	private onSubmit = async (msg: string) => {
		const { alerts, dispatch, token, user } = this.props;

		if (msg.trim() === '') {
			return;
		}

		await this.grantUser();
		const { _id: rid } = await this.getRoom();

		try {
			this.stopTypingDebounced.stop();
			await Promise.all([this.stopTyping({ rid, username: user?.username ?? '' }), Livechat.sendMessage({ msg, token, rid })]);
		} catch (error: any) {
			const reason = error?.error ?? error.message;
			const alert = { id: createToken(), children: reason, error: true, timeout: 5000 };
			dispatch({ alerts: (alerts.push(alert), alerts) });
		}
		await Livechat.notifyVisitorActivity(rid, user?.username ?? '', []);
	};

	private doFileUpload = async (rid: string, file: File) => {
		const { alerts, dispatch, t } = this.props;

		try {
			await Livechat.uploadFile(rid, file);
		} catch (error: any) {
			const {
				data: { reason, sizeAllowed },
			} = error;

			let message = t('fileupload_error');
			switch (reason) {
				case 'error-type-not-allowed':
					message = t('media_types_not_accepted');
					break;
				case 'error-size-not-allowed':
					message = t('file_exceeds_allowed_size_of_size', { size: sizeAllowed });
			}

			const alert = { id: createToken(), children: message, error: true, timeout: 5000 };
			dispatch({ alerts: (alerts.push(alert), alerts) });
		}
	};

	private onUpload = async (files: (File | null)[]) => {
		const { dispatch, alerts, t, uploads } = this.props;

		if (!uploads) {
			const alert = { id: createToken(), children: t('file_upload_disabled'), error: true, timeout: 5000 };
			dispatch({ alerts: (alerts.push(alert), alerts) });
			return;
		}

		await this.grantUser();
		const { _id: rid } = await this.getRoom();

		files.forEach((file) => {
			if (file) {
				void this.doFileUpload(rid, file);
			}
		});
	};

	private onSoundStop = async () => {
		const { dispatch, sound } = this.props;
		dispatch({ sound: { ...sound, play: false } });
	};

	private handleFinishChat = async () => {
		const { t, alerts, dispatch, room } = this.props;

		const { success } = await ModalManager.confirm({
			text: t('are_you_sure_you_want_to_finish_this_chat'),
		});

		if (!success) {
			return;
		}

		const { _id: rid } = room || {};

		dispatch({ loading: true });
		try {
			if (!rid) {
				throw new Error('error-room-not-found');
			}

			await Livechat.closeChat({ rid });
		} catch (error) {
			console.error(error);
			const alert = { id: createToken(), children: t('error_closing_chat'), error: true, timeout: 0 };
			dispatch({ alerts: (alerts.push(alert), alerts) });
		} finally {
			dispatch({ loading: false });
		}
	};

	private handleRemoveUserData = async () => {
		const { t, alerts, dispatch } = this.props;
		const { success } = await ModalManager.confirm({
			text: t('are_you_sure_you_want_to_remove_all_of_your_person'),
		});

		if (!success) {
			return;
		}

		dispatch({ loading: true });
		try {
			await Livechat.deleteVisitor();
		} catch (error) {
			console.error(error);
			const alert = { id: createToken(), children: t('error_removing_user_data'), error: true, timeout: 0 };
			dispatch({ alerts: (alerts.push(alert), alerts) });
		} finally {
			await loadConfig();
			dispatch({ loading: false });
			route('/chat-finished');
		}
	};

	private canSwitchDepartment = () => {
		const { allowSwitchingDepartments, departments = [] } = this.props;
		return !!allowSwitchingDepartments && departments.filter((dept) => dept.showOnRegistration).length > 1;
	};

	private canFinishChat = () => {
		const { room, connecting, visitorsCanCloseChat } = this.props;
		return !!visitorsCanCloseChat && (room?._id !== undefined || !!connecting);
	};

	private canRemoveUserData = () => {
		const { allowRemoveUserData } = this.props;
		return !!allowRemoveUserData;
	};

	private handleConnectingAgentAlert = async (connecting: boolean, message?: string | false) => {
		const { alerts: oldAlerts, dispatch, t } = this.props;
		const { connectingAgentAlertId } = constants;
		const alerts = oldAlerts.filter((item) => item.id !== connectingAgentAlertId);
		if (connecting) {
			alerts.push({
				id: connectingAgentAlertId,
				children: message || t('please_wait_for_the_next_available_agent'),
				warning: true,
				hideCloseButton: true,
				timeout: 0,
			});
		}

		dispatch({ alerts });
	};

	private handleQueueMessage = async (connecting: boolean, queueInfo?: StoreState['queueInfo']) => {
		const { room, dispatch, messages, innerStateRef } = this.props;

		if (!queueInfo) {
			return;
		}

		const { livechatQueueMessageId } = constants;
		const { message: { text: msg, user: u } = {} } = queueInfo;
		const { triggerQueueMessage } = innerStateRef.current;

		if (!room || !connecting || !msg || !triggerQueueMessage) {
			return;
		}

		innerStateRef.current.triggerQueueMessage = false;

		const ts = new Date();
		const message = { _id: livechatQueueMessageId, msg, u, ts: ts.toISOString() };
		dispatch({
			messages: upsert(
				messages,
				message,
				({ _id }) => _id === message._id,
				({ ts }) => ts,
			),
		});
	};

	override async componentDidMount() {
		const { checkConnectingAgent } = this;

		await checkConnectingAgent();
		await loadMessages();
		void processUnread();
	}

	override componentWillUnmount() {
		const { handleConnectingAgentAlert } = this;

		void handleConnectingAgentAlert(false);
	}

	override async componentDidUpdate({ messages: prevMessages, alerts: prevAlerts }: ChatContainerProps) {
		const { messages, dispatch, user } = this.props;
		const { checkConnectingAgent, checkRoom } = this;

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
	}: ChatContainerProps) => {
		const {
			onTop,
			onChangeText,
			onSubmit,
			onUpload,
			canSwitchDepartment,
			canFinishChat,
			handleFinishChat,
			canRemoveUserData,
			handleRemoveUserData,
			onSoundStop,
		} = this;

		const avatarResolver = getAvatarUrl;

		const uid = user?._id;

		const options = this.canSwitchDepartment() || this.canFinishChat() || this.canRemoveUserData();

		const onChangeDepartment = canSwitchDepartment() ? handleChangeDepartment : undefined;
		const onFinishChat = canFinishChat() ? handleFinishChat : undefined;
		const onRemoveUserData = canRemoveUserData() ? handleRemoveUserData : undefined;

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

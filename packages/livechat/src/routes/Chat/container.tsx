import type i18next from 'i18next';
import type { TFunction } from 'i18next';
import type { ComponentChildren, RefObject } from 'preact';
import { Component } from 'preact';
import { route } from 'preact-router';

import Chat from './component';
import { useChatSubscriptions } from './useChatSubscriptions';
import { Livechat } from '../../api';
import { ModalManager } from '../../components/Modal';
import type { ScreenContextValue } from '../../components/Screen/ScreenProvider';
import { getAvatarUrl } from '../../helpers/baseUrl';
import { canRenderMessage } from '../../helpers/canRenderMessage';
import { debounce } from '../../helpers/debounce';
import type { formatAgent } from '../../helpers/formatAgent';
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

type QueueInfo = {
	spot?: number;
	estimatedWaitTimeSeconds?: number;
	message?: { text?: string; user?: unknown };
};

export type ChatContainerProps = {
	title?: string;
	sound: StoreState['sound'];
	token: StoreState['token'];
	user?: StoreState['user'];
	agent?: ReturnType<typeof formatAgent>;
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
	queueInfo?: QueueInfo;
	registrationFormEnabled?: boolean;
	nameFieldRegistrationForm?: boolean;
	emailFieldRegistrationForm?: boolean;
	limitTextLength?: number;
	messageListPosition?: StoreState['messageListPosition'];
	theme: ScreenContextValue['theme'];
	visitorsCanCloseChat?: boolean;
	t: TFunction;
	i18n: typeof i18next;
};

type ChatWrapperProps = {
	children: ComponentChildren;
};

const ChatWrapper = ({ children }: ChatWrapperProps) => {
	useChatSubscriptions();

	return children;
};

type InnerState = {
	room: StoreState['room'] | null;
	connectingAgent: boolean;
	queueSpot: number;
	triggerQueueMessage: boolean;
	estimatedWaitTime: number | null | undefined;
};

class ChatContainer extends Component<ChatContainerProps> {
	private innerStateRef: RefObject<InnerState> = {
		current: {
			room: null,
			connectingAgent: false,
			queueSpot: 0,
			triggerQueueMessage: true,
			estimatedWaitTime: null,
		},
	};

	private checkConnectingAgent = async () => {
		const { connecting, queueInfo } = this.props;
		const { connectingAgent, queueSpot, estimatedWaitTime } = this.innerStateRef.current!;

		const newConnecting = !!connecting;
		const newQueueSpot = queueInfo?.spot || 0;
		const newEstimatedWaitTime = queueInfo?.estimatedWaitTimeSeconds;

		if (newConnecting !== connectingAgent || newQueueSpot !== queueSpot || newEstimatedWaitTime !== estimatedWaitTime) {
			this.innerStateRef.current!.connectingAgent = newConnecting;
			this.innerStateRef.current!.queueSpot = newQueueSpot;
			this.innerStateRef.current!.estimatedWaitTime = newEstimatedWaitTime;
			await this.handleQueueMessage(newConnecting, queueInfo);
			await this.handleConnectingAgentAlert(newConnecting, await normalizeQueueAlert(queueInfo));
		}
	};

	private checkRoom = () => {
		const { room } = this.props;
		const { room: stateRoom } = this.innerStateRef.current!;
		if (room && (!stateRoom || room._id !== stateRoom._id)) {
			this.innerStateRef.current!.room = room;
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
		const { alerts, dispatch, room, messages, i18n } = this.props;
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
				children: i18n.t('error_starting_a_new_conversation_reason', { reason }),
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

	private handleTop = () => {
		void loadMoreMessages();
	};

	private startTyping = throttle(async ({ rid, username }: { rid: string; username: string }) => {
		await Livechat.notifyVisitorActivity(rid, username, ['user-typing']);
		this.stopTypingDebounced({ rid, username });
	}, 4500);

	private stopTyping = ({ rid, username }: { rid: string; username: string }) => Livechat.notifyVisitorActivity(rid, username, []);

	private stopTypingDebounced = debounce(this.stopTyping, 5000);

	private handleChangeText = async () => {
		const { user, room } = this.props;
		if (!(user?.username && room?._id)) {
			return;
		}

		this.startTyping({ rid: room._id, username: user.username });
	};

	private handleSubmit = async (msg: string) => {
		if (msg.trim() === '') {
			return;
		}

		await this.grantUser();
		const { _id: rid } = await this.getRoom();
		const { alerts, dispatch, token, user } = this.props;

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
		const { alerts, dispatch, i18n } = this.props;

		try {
			await Livechat.uploadFile(rid, file);
		} catch (error: any) {
			const {
				data: { reason, sizeAllowed },
			} = error;

			let message = i18n.t('fileupload_error');
			switch (reason) {
				case 'error-type-not-allowed':
					message = i18n.t('media_types_not_accepted');
					break;
				case 'error-size-not-allowed':
					message = i18n.t('file_exceeds_allowed_size_of_size', { size: sizeAllowed });
			}

			const alert = { id: createToken(), children: message, error: true, timeout: 5000 };
			dispatch({ alerts: (alerts.push(alert), alerts) });
		}
	};

	private handleUpload = async (files: (File | null)[]) => {
		const {
			config: {
				settings: { fileUpload },
			},
		} = store.state;

		const { dispatch, alerts, i18n } = this.props;

		if (!fileUpload) {
			const alert = { id: createToken(), children: i18n.t('file_upload_disabled'), error: true, timeout: 5000 };
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

	private handleSoundStop = async () => {
		const { dispatch, sound } = this.props;
		dispatch({ sound: { ...sound, play: false } });
	};

	private onChangeDepartment = () => {
		route('/switch-department');
	};

	private onFinishChat = async () => {
		const { i18n } = this.props;

		const { success } = await ModalManager.confirm({
			text: i18n.t('are_you_sure_you_want_to_finish_this_chat'),
		});

		if (!success) {
			return;
		}

		const { alerts, dispatch, room } = this.props;
		const { _id: rid } = room || {};

		dispatch({ loading: true });
		try {
			if (!rid) {
				throw new Error('error-room-not-found');
			}

			await Livechat.closeChat({ rid });
		} catch (error) {
			console.error(error);
			const alert = { id: createToken(), children: i18n.t('error_closing_chat'), error: true, timeout: 0 };
			dispatch({ alerts: (alerts.push(alert), alerts) });
		} finally {
			dispatch({ loading: false });
		}
	};

	private onRemoveUserData = async () => {
		const { i18n } = this.props;
		const { success } = await ModalManager.confirm({
			text: i18n.t('are_you_sure_you_want_to_remove_all_of_your_person'),
		});

		if (!success) {
			return;
		}

		const { alerts, dispatch } = this.props;

		dispatch({ loading: true });
		try {
			await Livechat.deleteVisitor();
		} catch (error) {
			console.error(error);
			const alert = { id: createToken(), children: i18n.t('error_removing_user_data'), error: true, timeout: 0 };
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

	private registrationRequired = () => {
		const { registrationFormEnabled, nameFieldRegistrationForm, emailFieldRegistrationForm, departments = [], user } = this.props;

		if (user?.token) {
			return false;
		}

		if (!registrationFormEnabled) {
			return false;
		}

		const showDepartment = departments.filter((dept) => dept.showOnRegistration).length > 0;
		return !!(nameFieldRegistrationForm || emailFieldRegistrationForm || showDepartment);
	};

	private onRegisterUser = () => route('/register');

	private showOptionsMenu = () => this.canSwitchDepartment() || this.canFinishChat() || this.canRemoveUserData();

	private async handleConnectingAgentAlert(connecting: boolean, message?: string | false) {
		const { alerts: oldAlerts, dispatch, i18n } = this.props;
		const { connectingAgentAlertId } = constants;
		const alerts = oldAlerts.filter((item) => item.id !== connectingAgentAlertId);
		if (connecting) {
			alerts.push({
				id: connectingAgentAlertId,
				children: message || i18n.t('please_wait_for_the_next_available_agent'),
				warning: true,
				hideCloseButton: true,
				timeout: 0,
			});
		}

		dispatch({ alerts });
	}

	private async handleQueueMessage(connecting: boolean, queueInfo?: QueueInfo) {
		if (!queueInfo) {
			return;
		}

		const { livechatQueueMessageId } = constants;
		const { message: { text: msg, user: u } = {} } = queueInfo;
		const { triggerQueueMessage } = this.innerStateRef.current!;

		const { room } = this.props;
		if (!room || !connecting || !msg || !triggerQueueMessage) {
			return;
		}

		this.innerStateRef.current!.triggerQueueMessage = false;

		const { dispatch, messages } = this.props;
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
	}

	override async componentDidMount() {
		await this.checkConnectingAgent();
		await loadMessages();
		void processUnread();
	}

	override async componentDidUpdate(prevProps: ChatContainerProps) {
		const { messages, dispatch, user } = this.props;
		const { messages: prevMessages, alerts: prevAlerts } = prevProps;

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

		await this.checkConnectingAgent();
		this.checkRoom();
	}

	override componentWillUnmount() {
		void this.handleConnectingAgentAlert(false);
	}

	render = ({ user, ...props }: ChatContainerProps) => (
		<ChatWrapper>
			<Chat
				{...props}
				avatarResolver={getAvatarUrl}
				uid={user?._id}
				onTop={this.handleTop}
				onChangeText={this.handleChangeText}
				onSubmit={this.handleSubmit}
				onUpload={this.handleUpload}
				options={this.showOptionsMenu()}
				onChangeDepartment={(this.canSwitchDepartment() && this.onChangeDepartment) || null}
				onFinishChat={(this.canFinishChat() && this.onFinishChat) || null}
				onRemoveUserData={(this.canRemoveUserData() && this.onRemoveUserData) || null}
				onSoundStop={this.handleSoundStop}
				registrationRequired={this.registrationRequired()}
				onRegisterUser={this.onRegisterUser}
			/>
		</ChatWrapper>
	);
}

export default ChatContainer;

import { Component } from 'preact';
import { route } from 'preact-router';
import { withTranslation } from 'react-i18next';

import Chat from './component';
import { Livechat } from '../../api';
import { ModalManager } from '../../components/Modal';
import { getAvatarUrl } from '../../helpers/baseUrl';
import { canRenderMessage } from '../../helpers/canRenderMessage';
import { debounce } from '../../helpers/debounce';
import { throttle } from '../../helpers/throttle';
import { upsert } from '../../helpers/upsert';
import {
	useAgentChangeSubscription,
	useAgentStatusChangeSubscription,
	useQueuePositionChangeSubscription,
} from '../../hooks/livechatRoomSubscriptionHooks';
import { useDeleteMessageSubscription } from '../../hooks/useDeleteMessageSubscription';
import { useRoomMessagesSubscription } from '../../hooks/useRoomMessagesSubscription';
import { useUserActivitySubscription } from '../../hooks/useUserActivitySubscription';
import { normalizeQueueAlert } from '../../lib/api';
import constants from '../../lib/constants';
import { getLastReadMessage, loadConfig, processUnread, shouldMarkAsUnread } from '../../lib/main';
import { parentCall, runCallbackEventEmitter } from '../../lib/parentCall';
import { createToken } from '../../lib/random';
import { initRoom, loadMessages, loadMoreMessages, defaultRoomParams, getGreetingMessages } from '../../lib/room';
import store from '../../store';

const ChatWrapper = ({ children, rid }) => {
	useRoomMessagesSubscription(rid);

	useUserActivitySubscription(rid);

	useDeleteMessageSubscription(rid);

	useAgentChangeSubscription(rid);

	useAgentStatusChangeSubscription(rid);

	useQueuePositionChangeSubscription(rid);

	return children;
};

class ChatContainer extends Component {
	state = {
		room: null,
		connectingAgent: false,
		queueSpot: 0,
		triggerQueueMessage: true,
		estimatedWaitTime: null,
	};

	checkConnectingAgent = async () => {
		const { connecting, queueInfo } = this.props;
		const { connectingAgent, queueSpot, estimatedWaitTime } = this.state;

		const newConnecting = connecting;
		const newQueueSpot = (queueInfo && queueInfo.spot) || 0;
		const newEstimatedWaitTime = queueInfo && queueInfo.estimatedWaitTimeSeconds;

		if (newConnecting !== connectingAgent || newQueueSpot !== queueSpot || newEstimatedWaitTime !== estimatedWaitTime) {
			this.state.connectingAgent = newConnecting;
			this.state.queueSpot = newQueueSpot;
			this.state.estimatedWaitTime = newEstimatedWaitTime;
			await this.handleQueueMessage(connecting, queueInfo);
			await this.handleConnectingAgentAlert(newConnecting, await normalizeQueueAlert(queueInfo));
		}
	};

	checkRoom = () => {
		const { room } = this.props;
		const { room: stateRoom } = this.state;
		if (room && (!stateRoom || room._id !== stateRoom._id)) {
			this.state.room = room;
			setTimeout(loadMessages, 500);
		}
	};

	grantUser = async () => {
		const { token, user, guest, dispatch } = this.props;

		if (user) {
			return user;
		}

		const {
			iframe: { defaultDepartment },
		} = store.state;

		if (!guest?.department && defaultDepartment) {
			guest.department = defaultDepartment;
		}

		const visitor = { token, ...guest };
		const { visitor: newUser } = await Livechat.grantVisitor({ visitor });
		await dispatch({ user: newUser });
	};

	getRoom = async () => {
		const { alerts, dispatch, room, messages, i18n } = this.props;
		const previousMessages = getGreetingMessages(messages);

		if (room) {
			return room;
		}

		await dispatch({ loading: true });
		try {
			const params = defaultRoomParams();
			const newRoom = await Livechat.room(params);
			await dispatch({ room: newRoom, messages: previousMessages, noMoreMessages: false });
			await initRoom();

			parentCall('callback', 'chat-started');
			return newRoom;
		} catch (error) {
			const reason = error ? error.error : '';
			const alert = {
				id: createToken(),
				children: i18n.t('error_starting_a_new_conversation_reason', { reason }),
				error: true,
				timeout: 10000,
			};
			await dispatch({ loading: false, alerts: (alerts.push(alert), alerts) });

			runCallbackEventEmitter(reason);
			throw error;
		} finally {
			await dispatch({ loading: false });
		}
	};

	handleTop = () => {
		loadMoreMessages();
	};

	startTyping = throttle(async ({ rid, username }) => {
		await Livechat.notifyVisitorActivity(rid, username, ['user-typing']);
		this.stopTypingDebounced({ rid, username });
	}, 4500);

	stopTyping = ({ rid, username }) => Livechat.notifyVisitorActivity(rid, username, []);

	stopTypingDebounced = debounce(this.stopTyping, 5000);

	handleChangeText = async () => {
		const { user, room } = this.props;
		if (!(user && user.username && room && room._id)) {
			return;
		}

		this.startTyping({ rid: room._id, username: user.username });
	};

	handleSubmit = async (msg) => {
		if (msg.trim() === '') {
			return;
		}

		await this.grantUser();
		const { _id: rid } = await this.getRoom();
		const { alerts, dispatch, token, user } = this.props;

		try {
			this.stopTypingDebounced.stop();
			await Promise.all([this.stopTyping({ rid, username: user.username }), Livechat.sendMessage({ msg, token, rid })]);
		} catch (error) {
			const reason = error?.error ?? error.message;
			const alert = { id: createToken(), children: reason, error: true, timeout: 5000 };
			await dispatch({ alerts: (alerts.push(alert), alerts) });
		}
		await Livechat.notifyVisitorActivity(rid, user.username, []);
	};

	doFileUpload = async (rid, file) => {
		const { alerts, dispatch, i18n } = this.props;

		try {
			await Livechat.uploadFile(rid, file);
		} catch (error) {
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
			await dispatch({ alerts: (alerts.push(alert), alerts) });
		}
	};

	handleUpload = async (files) => {
		const {
			config: {
				settings: { fileUpload },
			},
		} = store.state;

		const { dispatch, alerts, i18n } = this.props;

		if (!fileUpload) {
			const alert = { id: createToken(), children: i18n.t('file_upload_disabled'), error: true, timeout: 5000 };
			await dispatch({ alerts: (alerts.push(alert), alerts) });
			return;
		}

		await this.grantUser();
		const { _id: rid } = await this.getRoom();

		files.forEach((file) => this.doFileUpload(rid, file));
	};

	handleSoundStop = async () => {
		const { dispatch, sound = {} } = this.props;
		await dispatch({ sound: { ...sound, play: false } });
	};

	onChangeDepartment = () => {
		route('/switch-department');
	};

	onFinishChat = async () => {
		const { i18n } = this.props;

		const { success } = await ModalManager.confirm({
			text: i18n.t('are_you_sure_you_want_to_finish_this_chat'),
		});

		if (!success) {
			return;
		}

		const { alerts, dispatch, room } = this.props;
		const { _id: rid } = room || {};

		await dispatch({ loading: true });
		try {
			if (!rid) {
				throw new Error('error-room-not-found');
			}

			await Livechat.closeChat({ rid });
		} catch (error) {
			console.error(error);
			const alert = { id: createToken(), children: i18n.t('error_closing_chat'), error: true, timeout: 0 };
			await dispatch({ alerts: (alerts.push(alert), alerts) });
		} finally {
			await dispatch({ loading: false });
		}
	};

	onRemoveUserData = async () => {
		const { i18n } = this.props;
		const { success } = await ModalManager.confirm({
			text: i18n.t('are_you_sure_you_want_to_remove_all_of_your_person'),
		});

		if (!success) {
			return;
		}

		const { alerts, dispatch } = this.props;

		await dispatch({ loading: true });
		try {
			await Livechat.deleteVisitor();
		} catch (error) {
			console.error(error);
			const alert = { id: createToken(), children: i18n.t('error_removing_user_data'), error: true, timeout: 0 };
			await dispatch({ alerts: (alerts.push(alert), alerts) });
		} finally {
			await loadConfig();
			await dispatch({ loading: false });
			route('/chat-finished');
		}
	};

	canSwitchDepartment = () => {
		const { allowSwitchingDepartments, departments = {} } = this.props;
		return allowSwitchingDepartments && departments.filter((dept) => dept.showOnRegistration).length > 1;
	};

	canFinishChat = () => {
		const { room, connecting, visitorsCanCloseChat } = this.props;
		return visitorsCanCloseChat && (room?._id !== undefined || connecting);
	};

	canRemoveUserData = () => {
		const { allowRemoveUserData } = this.props;
		return allowRemoveUserData;
	};

	registrationRequired = () => {
		const { registrationFormEnabled, nameFieldRegistrationForm, emailFieldRegistrationForm, departments = [], user } = this.props;

		if (user && user.token) {
			return false;
		}

		if (!registrationFormEnabled) {
			return false;
		}

		const showDepartment = departments.filter((dept) => dept.showOnRegistration).length > 0;
		return nameFieldRegistrationForm || emailFieldRegistrationForm || showDepartment;
	};

	onRegisterUser = () => route('/register');

	showOptionsMenu = () => this.canSwitchDepartment() || this.canFinishChat() || this.canRemoveUserData();

	async handleConnectingAgentAlert(connecting, message) {
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

		await dispatch({ alerts });
	}

	async handleQueueMessage(connecting, queueInfo) {
		if (!queueInfo) {
			return;
		}

		const { livechatQueueMessageId } = constants;
		const { message: { text: msg, user: u } = {} } = queueInfo;
		const { triggerQueueMessage } = this.state;

		const { room } = this.props;
		if (!room || !connecting || !msg || !triggerQueueMessage) {
			return;
		}

		this.state.triggerQueueMessage = false;

		const { dispatch, messages } = this.props;
		const ts = new Date();
		const message = { _id: livechatQueueMessageId, msg, u, ts: ts.toISOString() };
		await dispatch({
			messages: upsert(
				messages,
				message,
				({ _id }) => _id === message._id,
				({ ts }) => ts,
			),
		});
	}

	async componentDidMount() {
		await this.checkConnectingAgent();
		await loadMessages();
		processUnread();
	}

	async componentDidUpdate(prevProps) {
		const { messages, dispatch, user } = this.props;
		const { messages: prevMessages, alerts: prevAlerts } = prevProps;

		const renderedMessages = messages.filter((message) => canRenderMessage(message));
		const lastRenderedMessage = renderedMessages[renderedMessages.length - 1];
		const prevRenderedMessages = prevMessages.filter((message) => canRenderMessage(message));

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

	componentWillUnmount() {
		this.handleConnectingAgentAlert(false);
	}

	render = ({ user, ...props }) => (
		<ChatWrapper token={props.token} rid={props.room?._id}>
			<Chat
				{...props}
				avatarResolver={getAvatarUrl}
				uid={user && user._id}
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

export default withTranslation()(ChatContainer);

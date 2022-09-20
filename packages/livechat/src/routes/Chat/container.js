import { Component } from 'preact';
import { route } from 'preact-router';
import { withTranslation } from 'react-i18next';

import { Livechat } from '../../api';
import { ModalManager } from '../../components/Modal';
import { debounce, getAvatarUrl, canRenderMessage, throttle, upsert } from '../../components/helpers';
import { normalizeQueueAlert } from '../../lib/api';
import constants from '../../lib/constants';
import { loadConfig } from '../../lib/main';
import { parentCall, runCallbackEventEmitter } from '../../lib/parentCall';
import { createToken } from '../../lib/random';
import { initRoom, closeChat, loadMessages, loadMoreMessages, defaultRoomParams, getGreetingMessages } from '../../lib/room';
import { Consumer } from '../../store';
import Chat from './component';

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
			await this.handleConnectingAgentAlert(newConnecting, normalizeQueueAlert(queueInfo));
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

		const visitor = { token, ...guest };
		const newUser = await Livechat.grantVisitor({ visitor });
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
			const {
				data: { error: reason },
			} = error;
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
		await Livechat.notifyVisitorTyping(rid, username, true);
		this.stopTypingDebounced({ rid, username });
	}, 4500);

	stopTyping = ({ rid, username }) => Livechat.notifyVisitorTyping(rid, username, false);

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
			const reason = error?.data?.error ?? error.message;
			const alert = { id: createToken(), children: reason, error: true, timeout: 5000 };
			await dispatch({ alerts: (alerts.push(alert), alerts) });
		}
		await Livechat.notifyVisitorTyping(rid, user.username, false);
	};

	doFileUpload = async (rid, file) => {
		const { alerts, dispatch, i18n } = this.props;

		try {
			await Livechat.uploadFile({ rid, file });
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

		const { alerts, dispatch, room: { _id: rid } = {} } = this.props;

		await dispatch({ loading: true });
		try {
			if (rid) {
				await Livechat.closeChat({ rid });
			}
		} catch (error) {
			console.error(error);
			const alert = { id: createToken(), children: i18n.t('error_closing_chat'), error: true, timeout: 0 };
			await dispatch({ alerts: (alerts.push(alert), alerts) });
		} finally {
			await dispatch({ loading: false });
			await closeChat();
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
		const { room, connecting } = this.props;
		return room !== undefined || connecting;
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
		loadMessages();
	}

	async componentDidUpdate(prevProps) {
		const { messages, visible, minimized, dispatch } = this.props;
		const { messages: prevMessages, alerts: prevAlerts } = prevProps;

		if (messages && prevMessages && messages.length !== prevMessages.length && visible && !minimized) {
			const nextLastMessage = messages[messages.length - 1];
			const lastMessage = prevMessages[prevMessages.length - 1];
			if (
				(nextLastMessage && lastMessage && nextLastMessage._id !== lastMessage._id) ||
				(messages.length === 1 && prevMessages.length === 0)
			) {
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
	);
}

export const ChatConnector = ({ ref, t, ...props }) => (
	<Consumer>
		{({
			config: {
				settings: {
					fileUpload: uploads,
					allowSwitchingDepartments,
					forceAcceptDataProcessingConsent: allowRemoveUserData,
					showConnecting,
					registrationForm,
					nameFieldRegistrationForm,
					emailFieldRegistrationForm,
					limitTextLength,
				} = {},
				messages: { conversationFinishedMessage } = {},
				theme: { color, title } = {},
				departments = {},
			},
			iframe: {
				theme: { color: customColor, fontColor: customFontColor, iconColor: customIconColor, title: customTitle } = {},
				guest,
			} = {},
			token,
			agent,
			sound,
			user,
			room,
			messages,
			noMoreMessages,
			typing,
			loading,
			dispatch,
			alerts,
			visible,
			unread,
			lastReadMessageId,
			triggerAgent,
			queueInfo,
			incomingCallAlert,
			ongoingCall,
		}) => (
			<ChatContainer
				ref={ref}
				{...props}
				theme={{
					color: customColor || color,
					fontColor: customFontColor,
					iconColor: customIconColor,
					title: customTitle,
				}}
				title={customTitle || title || t('need_help')}
				sound={sound}
				token={token}
				user={user}
				agent={
					agent
						? {
								_id: agent._id,
								name: agent.name,
								status: agent.status,
								email: agent.emails && agent.emails[0] && agent.emails[0].address,
								username: agent.username,
								phone: (agent.phone && agent.phone[0] && agent.phone[0].phoneNumber) || (agent.customFields && agent.customFields.phone),
								avatar: agent.username
									? {
											description: agent.username,
											src: getAvatarUrl(agent.username),
									  }
									: undefined,
						  }
						: undefined
				}
				room={room}
				messages={messages && messages.filter((message) => canRenderMessage(message))}
				noMoreMessages={noMoreMessages}
				emoji={true}
				uploads={uploads}
				typingUsernames={Array.isArray(typing) ? typing : []}
				loading={loading}
				showConnecting={showConnecting} // setting from server that tells if app needs to show "connecting" sometimes
				connecting={!!(room && !agent && (showConnecting || queueInfo))}
				dispatch={dispatch}
				departments={departments}
				allowSwitchingDepartments={allowSwitchingDepartments}
				conversationFinishedMessage={conversationFinishedMessage || t('conversation_finished')}
				allowRemoveUserData={allowRemoveUserData}
				alerts={alerts}
				visible={visible}
				unread={unread}
				lastReadMessageId={lastReadMessageId}
				guest={guest}
				triggerAgent={triggerAgent}
				queueInfo={
					queueInfo
						? {
								spot: queueInfo.spot,
								estimatedWaitTimeSeconds: queueInfo.estimatedWaitTimeSeconds,
								message: queueInfo.message,
						  }
						: undefined
				}
				registrationFormEnabled={registrationForm}
				nameFieldRegistrationForm={nameFieldRegistrationForm}
				emailFieldRegistrationForm={emailFieldRegistrationForm}
				limitTextLength={limitTextLength}
				incomingCallAlert={incomingCallAlert}
				ongoingCall={ongoingCall}
			/>
		)}
	</Consumer>
);

export default withTranslation()(ChatConnector);

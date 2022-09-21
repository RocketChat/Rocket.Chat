import i18next from 'i18next';
import { route } from 'preact-router';

import { Livechat } from '../api';
import { CallStatus, isCallOngoing } from '../components/Calls/CallStatus';
import { setCookies, upsert, canRenderMessage } from '../components/helpers';
import { store, initialState } from '../store';
import { normalizeAgent } from './api';
import Commands from './commands';
import constants from './constants';
import { loadConfig, processUnread } from './main';
import { parentCall } from './parentCall';
import { createToken } from './random';
import { normalizeMessage, normalizeMessages } from './threads';
import { handleTranscript } from './transcript';

const commands = new Commands();

export const closeChat = async ({ transcriptRequested } = {}) => {
	if (!transcriptRequested) {
		await handleTranscript();
	}

	const { config: { settings: { clearLocalStorageWhenChatEnded } = {} } = {} } = store.state;

	if (clearLocalStorageWhenChatEnded) {
		// exclude UI-affecting flags
		const { minimized, visible, undocked, expanded, businessUnit, ...initial } = initialState();
		await store.setState(initial);
	}

	await loadConfig();
	parentCall('callback', 'chat-ended');
	route('/chat-finished');
};

const getVideoConfMessageData = (message) =>
	message.blocks?.find(({ appId }) => appId === 'videoconf-core')?.elements?.find(({ actionId }) => actionId === 'joinLivechat');

const isVideoCallMessage = (message) => {
	if (message.t === constants.webRTCCallStartedMessageType) {
		return true;
	}

	if (getVideoConfMessageData(message)) {
		return true;
	}

	return false;
};

const findCallData = (message) => {
	const videoConfJoinBlock = getVideoConfMessageData(message);
	if (videoConfJoinBlock) {
		return {
			callId: videoConfJoinBlock.blockId,
			url: videoConfJoinBlock.url,
			callProvider: 'video-conference',
		};
	}

	return { callId: message._id, url: '', callProvider: message.t };
};

// TODO: use a separate event to listen to call start event. Listening on the message type isn't a good solution
export const processIncomingCallMessage = async (message) => {
	const { alerts } = store.state;
	try {
		const { callId, url, callProvider } = findCallData(message);

		await store.setState({
			incomingCallAlert: {
				show: true,
				callProvider,
				callerUsername: message.u.username,
				rid: message.rid,
				time: message.ts,
				callId,
				url,
			},
			ongoingCall: {
				callStatus: CallStatus.RINGING,
				time: message.ts,
			},
		});
	} catch (err) {
		console.error(err);
		const alert = { id: createToken(), children: i18next.t('error_getting_call_alert'), error: true, timeout: 5000 };
		await store.setState({ alerts: (alerts.push(alert), alerts) });
	}
};

const processMessage = async (message) => {
	if (message.t === 'livechat-close') {
		closeChat(message);
	} else if (message.t === 'command') {
		commands[message.msg] && commands[message.msg]();
	} else if (message.webRtcCallEndTs) {
		await store.setState({ ongoingCall: { callStatus: CallStatus.ENDED, time: message.ts }, incomingCallAlert: null });
	} else if (isVideoCallMessage(message)) {
		await processIncomingCallMessage(message);
	}
};

const doPlaySound = async (message) => {
	const { sound, user } = store.state;

	if (!sound.enabled || (user && message.u && message.u._id === user._id)) {
		return;
	}

	await store.setState({ sound: { ...sound, play: true } });
};

export const initRoom = async () => {
	const { state } = store;
	const { room } = state;

	if (!room) {
		return;
	}

	Livechat.unsubscribeAll();

	const {
		token,
		agent,
		queueInfo,
		room: { _id: rid, servedBy },
	} = state;
	Livechat.subscribeRoom(rid);

	let roomAgent = agent;
	if (!roomAgent) {
		if (servedBy) {
			roomAgent = await Livechat.agent({ rid });
			await store.setState({ agent: roomAgent, queueInfo: null });
			parentCall('callback', ['assign-agent', normalizeAgent(roomAgent)]);
		}
	}

	if (queueInfo) {
		parentCall('callback', ['queue-position-change', queueInfo]);
	}

	Livechat.onAgentChange(rid, async (agent) => {
		await store.setState({ agent, queueInfo: null });
		parentCall('callback', ['assign-agent', normalizeAgent(agent)]);
	});

	Livechat.onAgentStatusChange(rid, (status) => {
		const { agent } = store.state;
		agent && store.setState({ agent: { ...agent, status } });
		parentCall('callback', ['agent-status-change', normalizeAgent(agent)]);
	});

	Livechat.onQueuePositionChange(rid, async (queueInfo) => {
		await store.setState({ queueInfo });
		parentCall('callback', ['queue-position-change', queueInfo]);
	});

	setCookies(rid, token);
};

const isAgentHidden = () => {
	const { config: { settings: { agentHiddenInfo } = {} } = {} } = store.state;

	return !!agentHiddenInfo;
};

const transformAgentInformationOnMessage = (message) => {
	const { user } = store.state;
	if (message && user && message.u && message.u._id !== user._id && isAgentHidden()) {
		return { ...message, u: { _id: message.u._id } };
	}

	return message;
};

Livechat.onTyping((username, isTyping) => {
	const { typing, user, agent } = store.state;

	if (user && user.username && user.username === username) {
		return;
	}

	if (agent && agent.hiddenInfo) {
		return;
	}

	if (typing.indexOf(username) === -1 && isTyping) {
		typing.push(username);
		return store.setState({ typing });
	}

	if (!isTyping) {
		return store.setState({ typing: typing.filter((u) => u !== username) });
	}
});

Livechat.onMessage(async (message) => {
	if (message.ts instanceof Date) {
		message.ts = message.ts.toISOString();
	}

	message = await normalizeMessage(message);
	if (!message) {
		return;
	}

	message = transformAgentInformationOnMessage(message);

	await store.setState({
		messages: upsert(
			store.state.messages,
			message,
			({ _id }) => _id === message._id,
			({ ts }) => ts,
		),
	});

	await processMessage(message);

	if (canRenderMessage(message) !== true) {
		return;
	}

	if (message.editedAt) {
		return;
	}

	await processUnread();
	await doPlaySound(message);
});

export const getGreetingMessages = (messages) => messages && messages.filter((msg) => msg.trigger);
export const getLatestCallMessage = (messages) => messages && messages.filter((msg) => isVideoCallMessage(msg)).pop();

export const loadMessages = async () => {
	const { ongoingCall, messages: storedMessages, room } = store.state;

	if (!room?._id) {
		return;
	}

	const { _id: rid, callStatus } = room;
	const previousMessages = getGreetingMessages(storedMessages);

	await store.setState({ loading: true });
	const rawMessages = (await Livechat.loadMessages(rid)).concat(previousMessages);
	const messages = (await normalizeMessages(rawMessages)).map(transformAgentInformationOnMessage);

	await initRoom();
	await store.setState({ messages: (messages || []).reverse(), noMoreMessages: false, loading: false });

	if (messages && messages.length) {
		const lastMessage = messages[messages.length - 1];
		await store.setState({ lastReadMessageId: lastMessage && lastMessage._id });
	}

	if (ongoingCall && isCallOngoing(ongoingCall.callStatus)) {
		return;
	}

	const latestCallMessage = getLatestCallMessage(messages);
	if (!latestCallMessage) {
		return;
	}
	const videoConfJoinBlock = getVideoConfMessageData(latestCallMessage);
	if (videoConfJoinBlock) {
		await store.setState({
			ongoingCall: {
				callStatus: CallStatus.IN_PROGRESS_DIFFERENT_TAB,
				time: latestCallMessage.ts,
			},
			incomingCallAlert: {
				show: false,
				callProvider: latestCallMessage.t,
				url: videoConfJoinBlock.url,
			},
		});
		return;
	}
	switch (callStatus) {
		case CallStatus.IN_PROGRESS: {
			await store.setState({
				ongoingCall: {
					callStatus: CallStatus.IN_PROGRESS_DIFFERENT_TAB,
					time: latestCallMessage.ts,
				},
				incomingCallAlert: {
					show: false,
					callProvider: latestCallMessage.t,
				},
			});
			break;
		}
		case CallStatus.RINGING: {
			processIncomingCallMessage(latestCallMessage);
		}
	}
};

export const loadMoreMessages = async () => {
	const { room: { _id: rid } = {}, messages = [], noMoreMessages = false } = store.state;

	if (!rid || noMoreMessages) {
		return;
	}

	await store.setState({ loading: true });

	const rawMessages = await Livechat.loadMessages(rid, { limit: messages.length + 10 });
	const moreMessages = (await normalizeMessages(rawMessages)).map(transformAgentInformationOnMessage);

	await store.setState({
		messages: (moreMessages || []).reverse(),
		noMoreMessages: messages.length + 10 > moreMessages.length,
		loading: false,
	});
};

export const defaultRoomParams = () => {
	const params = {};

	const { defaultAgent: agent = {} } = store.state;
	if (agent && agent._id) {
		Object.assign(params, { agentId: agent._id });
	}

	return params;
};

store.on('change', ([state, prevState]) => {
	// Cross-tab communication
	// Detects when a room is created and then route to the correct container
	if (!prevState.room && state.room) {
		route('/');
	}
});

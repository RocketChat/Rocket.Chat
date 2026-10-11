import i18next from 'i18next';
import { route } from 'preact-router';

import { Livechat } from '../api';
import { canRenderMessage } from '../helpers/canRenderMessage';
import { setCookies } from '../helpers/cookies';
import { upsert } from '../helpers/upsert';
import type { StoreState } from '../store';
import { store, initialState } from '../store';
import { normalizeAgent } from './api';
import Commands from './commands';
import { loadConfig, processUnread } from './main';
import { parentCall } from './parentCall';
import { createToken } from './random';
import { normalizeMessage, normalizeMessages } from './threads';
import { handleTranscript } from './transcript';
import Triggers from './triggers';

const commands = new Commands();

export const closeChat = async ({ transcriptRequested }: { transcriptRequested?: boolean } = {}) => {
	if (!transcriptRequested) {
		await handleTranscript();
	}

	const { department, config: { settings: { clearLocalStorageWhenChatEnded } = {} } = {} } = store.state as StoreState & {
		department?: string;
	};

	await store.setState({ room: null, renderedTriggers: [] });

	if (clearLocalStorageWhenChatEnded) {
		// exclude UI-affecting flags
		const { iframe: currentIframe } = store.state;
		const { minimized, visible, undocked, expanded, businessUnit, config, iframe, ...initial } = initialState();
		await store.setState({ ...initial, iframe: { ...currentIframe, guest: { department } } });
	}

	await Triggers.processTrigger('after-guest-registration');

	await loadConfig();
	parentCall('callback', 'chat-ended');
	route('/chat-finished');
};

const getVideoConfMessageData = (message: any) =>
	message.blocks
		?.find(({ appId, type }: any) => appId === 'videoconf-core' && type === 'actions')
		?.elements?.find(({ actionId }: any) => actionId === 'joinLivechat');

const isVideoCallMessage = (message: any) => {
	if (getVideoConfMessageData(message)) {
		return true;
	}

	return false;
};

const findCallData = (message: any) => {
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
export const processIncomingCallMessage = async (message: any) => {
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
		});
	} catch (err) {
		console.error(err);
		const alert = { id: createToken(), children: i18next.t('error_getting_call_alert'), error: true, timeout: 5000 };
		await store.setState({ alerts: (alerts.push(alert), alerts) });
	}
};

const processMessage = async (message: any) => {
	if (message.t === 'livechat-close') {
		await closeChat(message);
	} else if (message.t === 'command') {
		const command = (commands as unknown as Record<string, (() => void) | undefined>)[message.msg];
		command?.();
	} else if (isVideoCallMessage(message)) {
		await processIncomingCallMessage(message);
	}
};

const doPlaySound = async (message: any) => {
	const { sound, user } = store.state;

	if (!sound.enabled || (user && message.u && message.u._id === user._id)) {
		return;
	}

	await store.setState({ sound: { ...sound, play: true } });
};

export const onAgentChange = async (agent: any) => {
	await store.setState({ agent, queueInfo: undefined });
	parentCall('callback', ['assign-agent', normalizeAgent(agent)]);
};

export const onAgentStatusChange = (status: any) => {
	const { agent } = store.state;
	agent && store.setState({ agent: { ...agent, status } });
	parentCall('callback', ['agent-status-change', normalizeAgent(agent)]);
};

export const onQueuePositionChange = async (queueInfo: any) => {
	await store.setState({ queueInfo });
	parentCall('callback', ['queue-position-change', queueInfo]);
};

export const initRoom = async () => {
	const { room } = store.state;

	if (!room) {
		return;
	}

	const { token, agent, queueInfo } = store.state;
	const { _id: rid, servedBy } = room;

	let roomAgent = agent;
	if (!roomAgent) {
		if (servedBy) {
			roomAgent = await Livechat.agent(rid);
			await store.setState({ agent: roomAgent, queueInfo: undefined });
			parentCall('callback', 'assign-agent', normalizeAgent(roomAgent));
		}
	}

	if (queueInfo) {
		parentCall('callback', 'queue-position-change', queueInfo);
	}

	setCookies(rid, token);
};

const isAgentHidden = () => {
	const { config: { settings: { agentHiddenInfo } = {} } = {} } = store.state;

	return !!agentHiddenInfo;
};

const transformAgentInformationOnMessage = (message: any) => {
	const { user } = store.state;
	if (message && user && message.u && message.u._id !== user._id && isAgentHidden()) {
		return { ...message, u: { _id: message.u._id } };
	}

	return message;
};

export const onUserActivity = (username: string, activities: string[]) => {
	const isTyping = activities.includes('user-typing');
	const { typing, user, agent } = store.state;

	if (user?.username && user.username === username) {
		return;
	}

	if (agent?.hiddenInfo) {
		return;
	}

	if (typing.indexOf(username) === -1 && isTyping) {
		typing.push(username);
		return store.setState({ typing });
	}

	if (!isTyping) {
		return store.setState({ typing: typing.filter((u) => u !== username) });
	}
};

export const onMessage = async (originalMessage: any) => {
	let message = JSON.parse(JSON.stringify(originalMessage));

	if (message.ts instanceof Date) {
		message.ts = message.ts.toISOString();
	} else {
		message.ts = message.ts.$date ? new Date(message.ts.$date).toISOString() : new Date(message.ts).toISOString();
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
};

export const getGreetingMessages = (messages?: any[]) => messages?.filter((msg) => msg.trigger);
export const getLatestCallMessage = (messages?: any[]) => messages?.filter((msg) => isVideoCallMessage(msg)).pop();

export const loadMessages = async () => {
	const { messages: storedMessages, room, renderedTriggers } = store.state;

	if (!room?._id) {
		return;
	}

	const { _id: rid } = room;
	const previousMessages = getGreetingMessages(storedMessages) ?? [];
	await store.setState({ loading: true });

	const rawMessages: any[] = (await Livechat.loadMessages(rid, {} as Parameters<typeof Livechat.loadMessages>[1])) ?? [];

	if (rawMessages?.length < 20) {
		const triggers = previousMessages.length === 0 ? renderedTriggers : previousMessages;
		rawMessages.push(...triggers.reverse());
	}

	const messages = (await normalizeMessages(rawMessages)).map(transformAgentInformationOnMessage);

	await initRoom();
	await store.setState({ messages: (messages || []).reverse(), noMoreMessages: false, loading: false });

	const latestCallMessage = getLatestCallMessage(messages);
	if (!latestCallMessage) {
		return;
	}
	const videoConfJoinBlock = getVideoConfMessageData(latestCallMessage);
	if (videoConfJoinBlock) {
		await store.setState({
			incomingCallAlert: {
				show: false,
				callProvider: latestCallMessage.t,
				url: videoConfJoinBlock.url,
			},
		});
	}
};

export const loadMoreMessages = async () => {
	const { room, messages = [], noMoreMessages = false, renderedTriggers } = store.state;
	const { _id: rid } = room || {};

	if (!rid || noMoreMessages) {
		return;
	}

	await store.setState({ loading: true });

	const rawMessages = await Livechat.loadMessages(rid, {
		limit: messages.length + 10,
	} as Parameters<typeof Livechat.loadMessages>[1]);
	const moreMessages = (await normalizeMessages(rawMessages)).map(transformAgentInformationOnMessage);

	const newNoMoreMessages = messages.length + 10 > moreMessages.length;
	const triggers = newNoMoreMessages ? [...renderedTriggers] : [];
	const newMessages = [...moreMessages, ...triggers].reverse();

	await store.setState({
		messages: newMessages,
		noMoreMessages: newNoMoreMessages,
		loading: false,
	});
};

export const defaultRoomParams = () => {
	const params: Record<string, unknown> = {};

	const { defaultAgent } = store.state;
	if (defaultAgent?._id) {
		Object.assign(params, { agentId: defaultAgent._id });
	}

	return params;
};

store.on('change', ([state, prevState]) => {
	// Cross-tab communication
	// Detects when a room is created and then route to the correct container
	if (prevState.room?._id !== state.room?._id) {
		route('/');
	}
});

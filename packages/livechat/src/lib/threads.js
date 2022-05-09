import { Livechat } from '../api';
import { upsert } from '../components/helpers';
import { store } from '../store';
import { createToken } from './random';

const addParentMessage = async (parentMessage) => {
	const { state } = store;
	const { parentMessages = [] } = state;
	const { tmid } = parentMessage;

	if (!parentMessages.find((msg) => msg._id === tmid)) {
		await store.setState({ parentMessages: upsert(parentMessages, parentMessage, ({ _id }) => _id === parentMessage._id, ({ ts }) => ts) });
	}
};

const isThreadMessage = async (message) => {
	if (!message || !message.replies) {
		return false;
	}

	await addParentMessage(message);
	return true;
};

const findParentMessage = async (tmid) => {
	const { state } = store;
	const { parentMessages = [], room, alerts } = state;

	let parentMessage = parentMessages.find((msg) => msg._id === tmid);
	if (!parentMessage) {
		const { _id: rid } = room;
		try {
			parentMessage = await Livechat.message(tmid, { rid });
			await addParentMessage(parentMessage);
		} catch (error) {
			const { data: { error: reason } } = error;
			const alert = { id: createToken(), children: reason, error: true, timeout: 5000 };
			await store.setState({ alerts: (alerts.push(alert), alerts) });
		}
	}

	return parentMessage;
};

const normalizeThreadMessage = async (message) => {
	const { state } = store;
	const { messages = [] } = state;

	let parentMessage = messages.find((msg) => msg._id === message.tmid);
	if (!parentMessage) {
		parentMessage = await findParentMessage(message.tmid);
	}
	const { msg, attachments = [] } = parentMessage;
	return Object.assign(message, { threadMsg: parentMessage, attachments: [{ attachments, text: msg, tmid: message.tmid }] });
};

export const normalizeMessage = async (message) => {
	const isThreadMsg = await isThreadMessage(message);
	if (isThreadMsg) {
		return null;
	}

	if (message && message.tmid && !message.threadMsg) {
		return normalizeThreadMessage(message);
	}

	return message;
};

export const normalizeMessages = (messages = []) =>
	Promise.all(
		messages.filter(
			async (message) => {
				const result = await normalizeMessage(message);
				return result;
			},
		),
	);

import { Livechat } from '../api';
import { createToken } from './random';
import { upsert } from '../helpers/upsert';
import { store } from '../store';

const addParentMessage = async (parentMessage: any) => {
	const { state } = store;
	const { parentMessages = [] } = state;
	const { tmid } = parentMessage;

	if (!parentMessages.find((msg) => msg._id === tmid)) {
		await store.setState({
			parentMessages: upsert(
				parentMessages,
				parentMessage,
				({ _id }) => _id === parentMessage._id,
				({ ts }) => ts,
			),
		});
	}
};

const isThreadMessage = async (message: any) => {
	if (!message?.replies) {
		return false;
	}

	await addParentMessage(message);
	return true;
};

const findParentMessage = async (tmid: string) => {
	const { state } = store;
	const { parentMessages = [], room, alerts } = state;

	let parentMessage = parentMessages.find((msg) => msg._id === tmid);
	if (!parentMessage) {
		const { _id: rid } = room ?? {};
		try {
			parentMessage = await Livechat.message(tmid, { rid } as Parameters<typeof Livechat.message>[1]);
			await addParentMessage(parentMessage);
		} catch (error: any) {
			const {
				data: { error: reason },
			} = error;
			const alert = { id: createToken(), children: reason, error: true, timeout: 5000 };
			await store.setState({ alerts: (alerts.push(alert), alerts) });
		}
	}

	return parentMessage;
};

const normalizeThreadMessage = async (message: any) => {
	const { state } = store;
	const { messages = [] } = state;

	let parentMessage = messages.find((msg) => msg._id === message.tmid);
	if (!parentMessage) {
		parentMessage = await findParentMessage(message.tmid);
	}
	const { msg, attachments = [] } = parentMessage;
	return Object.assign(message, { threadMsg: parentMessage, attachments: [{ attachments, text: msg, tmid: message.tmid }] });
};

export const normalizeMessage = async (message: any) => {
	const isThreadMsg = await isThreadMessage(message);
	if (isThreadMsg) {
		return null;
	}

	if (message?.tmid && !message.threadMsg) {
		return normalizeThreadMessage(message);
	}

	return message;
};

export const normalizeMessages = (messages: any[] = []): Promise<any[]> =>
	Promise.all(
		// FIXME: the async predicate makes `filter` keep every message (a Promise is always truthy), so no
		// filtering actually happens here. Preserved as-is during the JS->TS migration; revisit separately.
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		messages.filter(async (message) => {
			const result = await normalizeMessage(message);
			return result;
		}),
	);

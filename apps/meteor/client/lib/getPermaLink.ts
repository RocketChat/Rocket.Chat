import type { IMessage, Serialized } from '@rocket.chat/core-typings';

import { getUserId } from './user';

const getMessage = async (msgId: string): Promise<Serialized<IMessage> | null> => {
	try {
		const { sdk } = await import('./SDKClient');
		const { message } = await sdk.rest.get('/v1/chat.getMessage', { msgId });
		return message;
	} catch {
		return null;
	}
};

export const getPermaLinkFromMessage = async (message: Pick<IMessage, '_id' | 'rid'>): Promise<string> => {
	const { Rooms, Subscriptions } = await import('../stores');

	const roomData = Rooms.state.get(message.rid);

	if (!roomData) {
		throw new Error('room-not-found');
	}

	const subData = Subscriptions.state.find((record) => record.rid === roomData._id && record.u._id === getUserId());

	const { roomCoordinator } = await import('./rooms/roomCoordinator');

	const roomURL = roomCoordinator.getURL(roomData.t, { ...(subData || roomData), tab: '' });
	return `${roomURL}?msg=${message._id}`;
};

export const getPermaLink = async (msgId: string): Promise<string> => {
	if (!msgId) {
		throw new Error('invalid-parameter');
	}

	const { Messages } = await import('../stores');

	const msg = Messages.state.get(msgId) || (await getMessage(msgId));
	if (!msg) {
		throw new Error('message-not-found');
	}

	return getPermaLinkFromMessage(msg);
};

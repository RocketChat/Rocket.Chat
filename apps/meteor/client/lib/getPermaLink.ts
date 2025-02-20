import type { IMessage, Serialized } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';

const getMessage = async (msgId: string): Promise<Serialized<IMessage> | null> => {
	try {
		const { sdk } = await import('../../app/utils/client/lib/SDKClient');
		const { message } = await sdk.rest.get('/v1/chat.getMessage', { msgId });
		return message;
	} catch {
		return null;
	}
};

export const getPermaLink = async (msgId: string): Promise<string> => {
	if (!msgId) {
		throw new Error('invalid-parameter');
	}

	const { Messages, Rooms, Subscriptions } = await import('../../app/models/client');

	const msg = Messages.findOne(msgId) || (await getMessage(msgId));
	if (!msg) {
		throw new Error('message-not-found');
	}
	const roomData = Rooms.findOne({
		_id: msg.rid,
	});

	if (!roomData) {
		throw new Error('room-not-found');
	}

	const subData = Subscriptions.findOne({ 'rid': roomData._id, 'u._id': Meteor.userId() });

	const { roomCoordinator } = await import('./rooms/roomCoordinator');

	const roomURL = roomCoordinator.getURL(roomData.t, { ...(subData || roomData), tab: '' });
	return `${roomURL}?msg=${msgId}`;
};

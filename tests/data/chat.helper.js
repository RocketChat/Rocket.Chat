import { api, credentials, request } from './api-data';

export const sendSimpleMessage = ({ roomId, text = 'test message', tmid }) => {
	if (!roomId) {
		throw new Error('"roomId" is required in "sendSimpleMessage" test helper');
	}
	const message = {
		rid: roomId,
		text,
	};
	if (tmid) {
		message.tmid = tmid;
	}

	return request.post(api('chat.sendMessage')).set(credentials).send({ message });
};

export const pinMessage = ({ msgId }) => {
	if (!msgId) {
		throw new Error('"msgId" is required in "pinMessage" test helper');
	}

	return request.post(api('chat.pinMessage')).set(credentials).send({
		messageId: msgId,
	});
};

export const deleteMessage = ({ roomId, msgId }) => {
	if (!roomId) {
		throw new Error('"roomId" is required in "deleteMessage" test helper');
	}
	if (!msgId) {
		throw new Error('"msgId" is required in "deleteMessage" test helper');
	}

	return request.post(api('chat.delete')).set(credentials).send({
		roomId,
		msgId,
	});
};

export const getMessageById = ({ msgId }) => {
	if (!msgId) {
		throw new Error('"msgId" is required in "getMessageById" test helper');
	}

	return new Promise((resolve) => {
		request
			.get(api(`chat.getMessage?msgId=${msgId}`))
			.set(credentials)
			.end((err, res) => {
				resolve(res.body.message);
			});
	});
};

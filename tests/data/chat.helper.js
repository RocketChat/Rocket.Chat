import { api, credentials, request } from './api-data';

export const sendSimpleMessage = ({ roomId, text = 'test message' }) => {
	if (!roomId) {
		throw new Error('"roomId" is required in "sendSimpleMessage" test helper');
	}

	return request.post(api('chat.sendMessage'))
		.set(credentials)
		.send({
			message: {
				rid: roomId,
				text,
			},
		});
};

export const pinMessage = ({ msgId }) => {
	if (!msgId) {
		throw new Error('"msgId" is required in "pinMessage" test helper');
	}

	return request.post(api('chat.pinMessage'))
		.set(credentials)
		.send({
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

	return request.post(api('chat.delete'))
		.set(credentials)
		.send({
			roomId,
			msgId,
		});
};

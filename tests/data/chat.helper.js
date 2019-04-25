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

	return request.post(api('chat.sendMessage'))
		.set(credentials)
		.send({ message });
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

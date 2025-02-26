import type { Credentials } from '@rocket.chat/api-client';
import type { IRoom, IMessage } from '@rocket.chat/core-typings';

import { api, credentials, request } from './api-data';

export const sendSimpleMessage = ({
	roomId,
	text = 'test message',
	tmid,
	userCredentials = credentials,
}: {
	roomId: IRoom['_id'];
	text?: string;
	tmid?: IMessage['_id'];
	userCredentials?: Credentials;
}) => {
	if (!roomId) {
		throw new Error('"roomId" is required in "sendSimpleMessage" test helper');
	}
	const message: {
		rid: IRoom['_id'];
		text: string;
		tmid?: IMessage['_id'];
	} = {
		rid: roomId,
		text,
	};

	if (tmid) {
		message.tmid = tmid;
	}

	return request.post(api('chat.sendMessage')).set(userCredentials).send({ message });
};

export const sendMessage = ({
	message,
	requestCredentials,
}: {
	message: { rid: IRoom['_id']; msg: string } & Partial<Omit<IMessage, 'rid' | 'msg'>>;
	requestCredentials?: Credentials;
}) => {
	return request
		.post(api('chat.sendMessage'))
		.set(requestCredentials ?? credentials)
		.send({ message });
};

export const starMessage = ({ messageId, requestCredentials }: { messageId: IMessage['_id']; requestCredentials?: Credentials }) => {
	return request
		.post(api('chat.starMessage'))
		.set(requestCredentials ?? credentials)
		.send({ messageId });
};

export const pinMessage = ({ messageId, requestCredentials }: { messageId: IMessage['_id']; requestCredentials?: Credentials }) => {
	return request
		.post(api('chat.pinMessage'))
		.set(requestCredentials ?? credentials)
		.send({ messageId });
};

export const deleteMessage = ({ roomId, msgId }: { roomId: IRoom['_id']; msgId: IMessage['_id'] }) => {
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

export const getMessageById = ({ msgId }: { msgId: IMessage['_id'] }) => {
	if (!msgId) {
		throw new Error('"msgId" is required in "getMessageById" test helper');
	}

	return new Promise<IMessage>((resolve) => {
		void request
			.get(api(`chat.getMessage`))
			.query({ msgId })
			.set(credentials)
			.end((_err, res) => {
				resolve(res.body.message);
			});
	});
};

export const followMessage = ({ msgId, requestCredentials }: { msgId: IMessage['_id']; requestCredentials?: Credentials }) => {
	return request
		.post(api('chat.followMessage'))
		.set(requestCredentials ?? credentials)
		.send({ mid: msgId });
};

import type { IRoom, IMessage } from '@rocket.chat/core-typings';

import { api, credentials, request } from './api-data';

export const sendSimpleMessage = ({
	roomId,
	text = 'test message',
	tmid,
}: {
	roomId: IRoom['_id'];
	text?: string;
	tmid?: IMessage['_id'];
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

	return request.post(api('chat.sendMessage')).set(credentials).send({ message });
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

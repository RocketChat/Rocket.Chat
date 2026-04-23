import { request as baseRequest } from '@playwright/test';
import type { IMessage, IRoom } from '@rocket.chat/core-typings';

import type { BaseTest } from './test';
import { BASE_API_URL } from '../config/constants';
import type { IUserState } from '../fixtures/userStates';

type SendMessageOptions = {
	threadId?: string;
	asUser?: IUserState;
};

export async function sendMessage(api: BaseTest['api'], roomId: string, msg: string, options?: SendMessageOptions): Promise<string> {
	const payload = {
		message: {
			rid: roomId,
			msg,
			...(options?.threadId && { tmid: options.threadId }),
		},
	};

	if (options?.asUser) {
		const userContext = await baseRequest.newContext({
			baseURL: BASE_API_URL,
			extraHTTPHeaders: {
				'X-Auth-Token': options.asUser.data.loginToken,
				'X-User-Id': options.asUser.data._id,
			},
		});
		try {
			const response = await userContext.post('/chat.sendMessage', { data: payload });
			const data: { success?: boolean; message?: { _id: string } } = await response.json();

			if (!data.success || !data.message?._id) {
				throw new Error(`Error sending message: ${JSON.stringify(data)}`);
			}

			return data.message._id;
		} finally {
			await userContext.dispose();
		}
	}

	const response = await api.post('/chat.sendMessage', payload);
	const data: { success?: boolean; message?: { _id: string } } = await response.json();

	if (!data.success || !data.message?._id) {
		throw new Error(`Error sending message: ${JSON.stringify(data)}`);
	}

	return data.message._id;
}

export async function sendTargetChannelMessage(api: BaseTest['api'], roomName: string, options?: Partial<IMessage>) {
	const response = await api.get(`/channels.info?roomName=${roomName}`);

	const {
		channel: { _id: rid },
	}: { channel: IRoom } = await response.json();

	await api.post('/chat.sendMessage', {
		message: {
			rid,
			msg: options?.msg || 'simple message',
			...options,
		},
	});

	return options?.msg || 'simple message';
}

export async function createThreadReply(api: BaseTest['api'], roomId: string, parentMsgId: string, msg: string): Promise<string> {
	return sendMessage(api, roomId, msg, { threadId: parentMsgId });
}

import type { IMessage } from '@rocket.chat/core-typings';

import { RocketChatError } from './RocketChatError';

type MessageNotFoundErrorDetails = { mid: IMessage['_id'] };

export class MessageNotFoundError extends RocketChatError<'message-not-found', MessageNotFoundErrorDetails> {
	constructor(message = 'Message not found', details: MessageNotFoundErrorDetails) {
		super('message-not-found', message, details);
	}
}

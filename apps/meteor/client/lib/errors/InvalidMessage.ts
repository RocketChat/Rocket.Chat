import { RocketChatError } from './RocketChatError';

export class InvalidMessage extends RocketChatError<'invalid-message'> {
	constructor(message = 'Invalid message', details?: unknown) {
		super('invalid-message', message, details);
	}
}

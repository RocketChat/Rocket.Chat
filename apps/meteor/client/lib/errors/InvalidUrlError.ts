import { RocketChatError } from './RocketChatError';

export class InvalidUrlError extends RocketChatError<'invalid-url'> {
	constructor(message = 'Invalid url', details?: string) {
		super('invalid-url', message, details);
	}
}

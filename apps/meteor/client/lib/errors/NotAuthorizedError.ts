import { RocketChatError } from './RocketChatError';

export class NotAuthorizedError extends RocketChatError<'not-authorized'> {
	constructor(message = 'Not authorized', details?: unknown) {
		super('not-authorized', message, details);
	}
}

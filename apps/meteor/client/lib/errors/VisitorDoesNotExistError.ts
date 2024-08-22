import { RocketChatError } from './RocketChatError';

export class VisitorDoesNotExistError extends RocketChatError<'visitor-does-not-exist'> {
	constructor(message = 'Visitor does not exist', details?: string) {
		super('visitor-does-not-exist', message, details);
	}
}

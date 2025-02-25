import { RocketChatError } from './RocketChatError';

export class AppPreventedError extends RocketChatError<'error-app-prevented'> {
	constructor(message = 'App prevented action', details?: string) {
		super('error-app-prevented', message, details);
	}
}

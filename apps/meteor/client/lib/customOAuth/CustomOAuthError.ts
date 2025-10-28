import { RocketChatError } from '../errors/RocketChatError';

type CustomOAuthErrorDetails = {
	service?: string;
};

export class CustomOAuthError extends RocketChatError<'custom-oauth-error', CustomOAuthErrorDetails> {
	constructor(reason?: string, details?: CustomOAuthErrorDetails) {
		super('custom-oauth-error', details?.service ? `${details.service}: ${reason}` : reason, details);
	}
}

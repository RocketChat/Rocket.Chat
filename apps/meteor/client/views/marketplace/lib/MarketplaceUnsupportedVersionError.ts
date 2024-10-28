import { RocketChatError } from '../../../lib/errors/RocketChatError';

export class MarketplaceUnsupportedVersionError extends RocketChatError<'marketplace-unsupported-version'> {
	constructor(message = 'unsupported version', details?: string) {
		super('marketplace-unsupported-version', message, details);
	}
}

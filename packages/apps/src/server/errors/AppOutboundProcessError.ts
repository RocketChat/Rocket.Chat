export class AppOutboundProcessError extends Error {
	public name = 'OutboundProviderError';

	constructor(message: string, where?: string) {
		super(where ? `${message} (${where})` : message);
	}
}

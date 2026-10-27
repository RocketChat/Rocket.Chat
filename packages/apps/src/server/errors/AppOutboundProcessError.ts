export class AppOutboundProcessError implements Error {
	public name = 'OutboundProviderError';

	public message: string;

	constructor(message: string, where?: string) {
		this.message = message;
		if (where) {
			this.message += ` (${where})`;
		}
	}
}

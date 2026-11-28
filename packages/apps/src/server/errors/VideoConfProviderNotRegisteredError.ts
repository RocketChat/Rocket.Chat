export class VideoConfProviderNotRegisteredError extends Error {
	public name = 'VideoConfProviderNotRegistered';

	constructor(providerName: string) {
		super(`The video conference provider "${providerName}" is not registered in the system.`);
	}
}

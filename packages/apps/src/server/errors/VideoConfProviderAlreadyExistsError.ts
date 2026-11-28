export class VideoConfProviderAlreadyExistsError extends Error {
	public name = 'VideoConfProviderAlreadyExists';

	constructor(name: string) {
		super(`The video conference provider "${name}" was already registered by another App.`);
	}
}

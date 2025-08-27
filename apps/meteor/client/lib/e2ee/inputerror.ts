export class InputError extends Error {
	constructor(message: string) {
		super(message);
		Object.setPrototypeOf(this, InputError.prototype);
	}
}

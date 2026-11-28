export class PathAlreadyExistsError extends Error {
	public name = 'PathAlreadyExists';

	constructor(path: string) {
		super(`The api path "${path}" already exists in the system.`);
	}
}

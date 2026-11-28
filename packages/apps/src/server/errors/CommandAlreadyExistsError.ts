export class CommandAlreadyExistsError extends Error {
	public name = 'CommandAlreadyExists';

	constructor(command: string) {
		super(`The command "${command}" already exists in the system.`);
	}
}

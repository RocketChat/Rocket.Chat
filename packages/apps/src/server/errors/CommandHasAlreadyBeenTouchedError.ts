export class CommandHasAlreadyBeenTouchedError extends Error {
	public name = 'CommandHasAlreadyBeenTouched';

	constructor(command: string) {
		super(`The command "${command}" has already been touched by another App.`);
	}
}

export class CommandHasAlreadyBeenTouchedError implements Error {
    public name = 'CommandHasAlreadyBeenTouched';

    public message: string;

    constructor(command: string) {
        this.message = `The command "${command}" has already been touched by another App.`;
    }
}

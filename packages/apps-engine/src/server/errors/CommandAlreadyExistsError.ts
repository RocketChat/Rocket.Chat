export class CommandAlreadyExistsError implements Error {
    public name = 'CommandAlreadyExists';

    public message: string;

    constructor(command: string) {
        this.message = `The command "${command}" already exists in the system.`;
    }
}

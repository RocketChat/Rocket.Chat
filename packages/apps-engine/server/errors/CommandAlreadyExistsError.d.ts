export declare class CommandAlreadyExistsError implements Error {
    name: string;
    message: string;
    constructor(command: string);
}

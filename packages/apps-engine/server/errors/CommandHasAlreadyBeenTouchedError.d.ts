export declare class CommandHasAlreadyBeenTouchedError implements Error {
    name: string;
    message: string;
    constructor(command: string);
}

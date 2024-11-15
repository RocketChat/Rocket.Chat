export declare class MustContainFunctionError implements Error {
    name: string;
    message: string;
    constructor(fileName: string, funcName: string);
}

export class MustContainFunctionError implements Error {
    public name = 'MustContainFunction';

    public message: string;

    constructor(fileName: string, funcName: string) {
        this.message = `The App (${fileName}) doesn't have a "${funcName}" function which is required.`;
    }
}

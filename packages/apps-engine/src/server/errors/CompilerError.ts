export class CompilerError implements Error {
    public name = 'CompilerError';

    public message: string;

    constructor(detail: string) {
        this.message = `An error occured while compiling an App: ${detail}`;
    }
}

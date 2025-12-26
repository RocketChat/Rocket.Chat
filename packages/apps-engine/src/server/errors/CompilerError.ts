export class CompilerError implements Error {
	public name = 'CompilerError';

	public message: string;

	constructor(detail: string) {
		this.message = `An error occurred while compiling an App: ${detail}`;
	}
}

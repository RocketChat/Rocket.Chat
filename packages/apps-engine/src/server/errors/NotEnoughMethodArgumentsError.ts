export class NotEnoughMethodArgumentsError implements Error {
    public readonly name: string = 'NotEnoughMethodArgumentsError';

    public readonly message: string;

    constructor(method: string, requiredCount: number, providedCount: number) {
        this.message = `The method "${method}" requires ${requiredCount} parameters but was only passed ${providedCount}.`;
    }
}

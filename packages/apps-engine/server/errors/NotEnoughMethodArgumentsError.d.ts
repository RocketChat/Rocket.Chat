export declare class NotEnoughMethodArgumentsError implements Error {
    readonly name: string;
    readonly message: string;
    constructor(method: string, requiredCount: number, providedCount: number);
}

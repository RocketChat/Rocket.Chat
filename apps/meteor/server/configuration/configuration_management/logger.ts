export class Logger {
    public static log(message: string): void {
        console.log(`[LOG]: ${message}`);
    }

    public static error(message: string): void {
        console.error(`[ERROR]: ${message}`);
    }
}

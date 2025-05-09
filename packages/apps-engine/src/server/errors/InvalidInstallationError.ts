export class InvalidInstallationError extends Error {
    public constructor(message: string) {
        super(`Invalid app installation: ${message}`);
    }
}

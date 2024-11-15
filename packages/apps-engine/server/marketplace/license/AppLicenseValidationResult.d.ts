export declare class AppLicenseValidationResult {
    private errors;
    private warnings;
    private validated;
    private appId;
    addError(field: string, message: string): void;
    addWarning(field: string, message: string): void;
    get hasErrors(): boolean;
    get hasWarnings(): boolean;
    get hasBeenValidated(): boolean;
    setValidated(validated: boolean): void;
    setAppId(appId: string): void;
    getAppId(): string;
    getErrors(): object;
    getWarnings(): object;
    toJSON(): object;
}

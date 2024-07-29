export class AppLicenseValidationResult {
    private errors: { [key: string]: string } = {};

    private warnings: { [key: string]: string } = {};

    private validated = false;

    private appId: string;

    public addError(field: string, message: string): void {
        this.errors[field] = message;
    }

    public addWarning(field: string, message: string): void {
        this.warnings[field] = message;
    }

    public get hasErrors(): boolean {
        return !!Object.keys(this.errors).length;
    }

    public get hasWarnings(): boolean {
        return !!Object.keys(this.warnings).length;
    }

    public get hasBeenValidated(): boolean {
        return this.validated;
    }

    public setValidated(validated: boolean): void {
        this.validated = validated;
    }

    public setAppId(appId: string): void {
        this.appId = appId;
    }

    public getAppId(): string {
        return this.appId;
    }

    public getErrors(): object {
        return this.errors;
    }

    public getWarnings(): object {
        return this.warnings;
    }

    public toJSON(): object {
        return {
            errors: this.errors,
            warnings: this.warnings,
        };
    }
}

export class PasswordPolicyError extends Error {
	public error: string;

	public reasons?: { error: string; message: string }[] | undefined;

	constructor(message: string, error: string, reasons?: { error: string; message: string }[]) {
		super(message);
		this.error = error;
		this.reasons = reasons;
	}
}

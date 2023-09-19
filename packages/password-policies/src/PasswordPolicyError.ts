export class PasswordPolicyError extends Error {
	public error: string;

	public details?: { error: string; message: string }[] | undefined;

	constructor(message: string, error: string, details?: { error: string; message: string }[]) {
		super(message);
		this.error = error;
		this.details = details;
	}
}

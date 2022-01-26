export class ClientSafeError extends Error {
	public readonly isClientSafe = true;

	protected errorType: string | undefined;

	public constructor(public readonly error: string | number, public readonly reason?: string, public readonly details?: any) {
		super(String(error));
	}

	getErrorType(): string | undefined {
		return this.errorType;
	}

	public toJSON(): any {
		return {
			isClientSafe: true,
			errorType: this.errorType,
			error: this.error,
			reason: this.reason,
			message: `${this.reason} [${this.error}]`,
			...(this.details && { details: this.details }),
		};
	}
}

export class MethodError extends ClientSafeError {
	errorType = 'Meteor.Error';

	public constructor(public readonly error: string | number, public readonly reason?: string, public readonly details?: any) {
		super(error, reason, details);
	}
}

export const isClientSafeError = (error: any): error is ClientSafeError => error?.isClientSafe;

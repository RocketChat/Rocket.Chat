/**
 * An error whose code, reason and details may be sent to callers instead of a generic internal error.
 * It keeps Meteor.Error's wire shape, including `errorType: 'Meteor.Error'`, because clients recognize errors by it.
 */
export class ClientSafeError extends Error {
	public isClientSafe = true;

	public readonly errorType = 'Meteor.Error';

	public constructor(
		public readonly error: string | number,
		public readonly reason?: string,
		public readonly details?: any,
	) {
		super(`${reason ? `${reason} ` : ''}[${String(error)}]`);
	}

	/** Lets `EJSON.clone`, which Meteor Accounts applies to login attempts, copy the error instead of reducing it to a plain object. */
	public clone(): ClientSafeError {
		return new ClientSafeError(this.error, this.reason, this.details);
	}

	public toJSON(): any {
		return {
			isClientSafe: this.isClientSafe,
			errorType: this.errorType,
			error: this.error,
			reason: this.reason,
			message: this.message,
			...(this.details && { details: this.details }),
		};
	}
}

export const isClientSafeError = (error: any): error is ClientSafeError => error?.errorType === 'Meteor.Error';

export class MeteorError extends Error {
	public isClientSafe = true;

	public readonly errorType = 'Meteor.Error';

	public constructor(
		public readonly error: string | number,
		public readonly reason?: string,
		public readonly details?: any,
	) {
		super(`${reason ? `${reason} ` : ''}[${String(error)}]`);
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

export const isMeteorError = (error: any): error is MeteorError => error?.errorType === 'Meteor.Error';

export abstract class RocketChatError<TErrorId extends string, TDetails = unknown> extends Error {
	public readonly error: TErrorId;

	public readonly reason?: string;

	public readonly details?: TDetails;

	constructor(error: TErrorId, reason?: string, details?: TDetails) {
		super(reason ? `${reason} [${error}]` : `[${error}]`);
		this.error = error;
		this.reason = reason;
		this.details = details;
	}
}

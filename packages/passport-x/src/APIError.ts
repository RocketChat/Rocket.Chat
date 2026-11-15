/**
 * `APIError` error.
 */
export class APIError extends Error {
	public override readonly name: string = 'APIError';

	public status: number = 500;

	constructor(
		message: string,
		public readonly code: number,
	) {
		super(message);
	}
}

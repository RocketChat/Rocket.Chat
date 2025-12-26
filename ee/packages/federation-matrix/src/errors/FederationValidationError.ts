// Local copy to avoid broken import chain in homeserver's federation-sdk
export class FederationValidationError extends Error {
	public error: string;

	constructor(
		public code: 'POLICY_DENIED' | 'CONNECTION_FAILED' | 'USER_NOT_FOUND',
		public userMessage: string,
	) {
		super(userMessage);
		this.name = 'FederationValidationError';
		this.error = `federation-${code.toLowerCase().replace(/_/g, '-')}`;
	}
}

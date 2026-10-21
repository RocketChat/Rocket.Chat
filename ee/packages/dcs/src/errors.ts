export class SpifError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'SpifError';
	}
}

export class UnknownPolicyError extends Error {
	constructor(readonly policyId: string) {
		super(`Unknown security policy: ${policyId}`);
		this.name = 'UnknownPolicyError';
	}
}

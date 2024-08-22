export class InvalidLicenseError extends Error {
	constructor(message = 'Invalid license') {
		super(message);
		this.name = 'InvalidLicenseError';
	}
}

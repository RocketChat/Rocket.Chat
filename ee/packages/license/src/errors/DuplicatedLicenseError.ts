export class DuplicatedLicenseError extends Error {
	constructor(message = 'Duplicated license') {
		super(message);
		this.name = 'DuplicatedLicense';
	}
}

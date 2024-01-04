export class NotReadyForValidation extends Error {
	constructor(message = 'Not ready for validation') {
		super(message);
		this.name = 'NotReadyForValidation';
	}
}

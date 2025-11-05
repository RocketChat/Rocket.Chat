export class FormValidationError extends Error {
	constructor(message: string) {
		super(message);
	}
}

export class FormFetchError extends Error {
	constructor(message: string) {
		super(message);
	}
}

export class ContactNotFoundError extends FormFetchError {
	constructor() {
		super('error-contact-not-found');
	}
}

export class ProviderNotFoundError extends FormFetchError {
	constructor() {
		super('error-provider-not-found');
	}
}

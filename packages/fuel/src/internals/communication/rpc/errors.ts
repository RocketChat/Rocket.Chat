export class ServiceNotFound extends Error {
	constructor(message = 'Service Not Found') {
		super(message);
		this.name = 'ServiceNotFound';
	}
}

export class ServiceTimeout extends Error {
	constructor(message = 'Service Timeout') {
		super(message);
		this.name = 'ServiceTimeout';
	}
}

export class ServiceError extends Error {
	constructor(message = 'Service Error') {
		super(message);
		this.name = 'ServiceError';
	}
}

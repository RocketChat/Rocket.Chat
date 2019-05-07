import { logger } from '../logger';

export class FederatedResource {
	constructor(name) {
		this.resourceName = `federated-${ name }`;

		this.log('Creating federated resource');
	}

	log(message) {
		FederatedResource.log(this.resourceName, message);
	}
}

FederatedResource.log = function log(name, message) {
	logger.resource.info(`[${ name }] ${ message }`);
};

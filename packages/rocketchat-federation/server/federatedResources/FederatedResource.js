import { logger } from '../logger.js';

class FederatedResource {
	constructor(name) {
		this.resourceName = `federated-${ name }`;

		this.log('Creating federated resource');
	}

	log(message) {
		FederatedResource.log(this.resourceName, message);
	}
}

FederatedResource.log = function log(name, message) {
	logger.info(`[${ name }] ${ message }`);
};

export default FederatedResource;

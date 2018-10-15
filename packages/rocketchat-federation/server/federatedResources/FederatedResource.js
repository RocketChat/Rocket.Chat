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
	console.log(`[${ name }] ${ message }`);
};

export default FederatedResource;

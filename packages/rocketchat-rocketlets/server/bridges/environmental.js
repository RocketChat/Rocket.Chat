export class RocketletEnvironmentalVariableBridge {
	constructor(orch) {
		this.orch = orch;
		this.allowed = ['NODE_ENV', 'ROOT_URL', 'INSTANCE_IP'];
	}

	getValueByName(envVarName, rocketletId) {
		console.log(`The Rocketlet ${ rocketletId } is getting the environmental variable value ${ envVarName }.`);

		if (this.isReadable(envVarName, rocketletId)) {
			return process.env[envVarName];
		}

		throw new Error(`The environmental variable "${ envVarName }" is not readable.`);
	}

	isReadable(envVarName, rocketletId) {
		console.log(`The Rocketlet ${ rocketletId } is checking if the environmental variable is readable ${ envVarName }.`);

		return this.allowed.includes(envVarName.toUpperCase());
	}

	isSet(envVarName, rocketletId) {
		console.log(`The Rocketlet ${ rocketletId } is checking if the environmental variable is set ${ envVarName }.`);

		if (this.isReadable(envVarName, rocketletId)) {
			return typeof process.env[envVarName] !== 'undefined';
		}

		throw new Error(`The environmental variable "${ envVarName }" is not readable.`);
	}
}

export class AppEnvironmentalVariableBridge {
	constructor(orch) {
		this.orch = orch;
		this.allowed = ['NODE_ENV', 'ROOT_URL', 'INSTANCE_IP'];
	}

	getValueByName(envVarName, appId) {
		console.log(`The App ${ appId } is getting the environmental variable value ${ envVarName }.`);

		if (this.isReadable(envVarName, appId)) {
			return process.env[envVarName];
		}

		throw new Error(`The environmental variable "${ envVarName }" is not readable.`);
	}

	isReadable(envVarName, appId) {
		console.log(`The App ${ appId } is checking if the environmental variable is readable ${ envVarName }.`);

		return this.allowed.includes(envVarName.toUpperCase());
	}

	isSet(envVarName, appId) {
		console.log(`The App ${ appId } is checking if the environmental variable is set ${ envVarName }.`);

		if (this.isReadable(envVarName, appId)) {
			return typeof process.env[envVarName] !== 'undefined';
		}

		throw new Error(`The environmental variable "${ envVarName }" is not readable.`);
	}
}

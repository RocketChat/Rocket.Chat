export class AppEnvironmentalVariableBridge {
	constructor(orch) {
		this.orch = orch;
		this.allowed = ['NODE_ENV', 'ROOT_URL', 'INSTANCE_IP'];
	}

	async getValueByName(envVarName, appId) {
		this.orch.debugLog(`The App ${ appId } is getting the environmental variable value ${ envVarName }.`);

		if (!await this.isReadable(envVarName, appId)) {
			throw new Error(`The environmental variable "${ envVarName }" is not readable.`);
		}

		return process.env[envVarName];
	}

	async isReadable(envVarName, appId) {
		this.orch.debugLog(`The App ${ appId } is checking if the environmental variable is readable ${ envVarName }.`);

		return this.allowed.includes(envVarName.toUpperCase());
	}

	async isSet(envVarName, appId) {
		this.orch.debugLog(`The App ${ appId } is checking if the environmental variable is set ${ envVarName }.`);

		if (!await this.isReadable(envVarName, appId)) {
			throw new Error(`The environmental variable "${ envVarName }" is not readable.`);
		}

		return typeof process.env[envVarName] !== 'undefined';
	}
}

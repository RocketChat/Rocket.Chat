export class RocketletEnvironmentalVariableBridge {
	constructor(orch) {
		this.orch = orch;
	}

	getValueByName(envVarName, rocketletId) {
		console.log(`The Rocketlet ${ rocketletId } is getting the environmental variable value ${ envVarName }.`);
		throw new Error('Method not implemented.');
	}

	isReadable(envVarName, rocketletId) {
		console.log(`The Rocketlet ${ rocketletId } is checking if the environmental variable is readable ${ envVarName }.`);
		throw new Error('Method not implemented.');
	}

	isSet(envVarName, rocketletId) {
		console.log(`The Rocketlet ${ rocketletId } is checking if the environmental variable is set ${ envVarName }.`);
		throw new Error('Method not implemented.');
	}
}

import { RocketletBridges } from 'temporary-rocketlets-server/server/bridges';
import { RocketletCommandsBridge } from './commands';
import { RocketletEnvironmentalVariableBridge } from './environmental';
import { RocketletSettingBridge } from './settings';

export class RealRocketletBridges extends RocketletBridges {
	constructor(orch) {
		super();

		this._cmdBridge = new RocketletCommandsBridge(orch);
		this._envBridge = new RocketletEnvironmentalVariableBridge(orch);
		this._setsBridge = new RocketletSettingBridge(orch);
	}

	getCommandBridge() {
		return this._cmdBridge;
	}

	getEnvironmentalVariableBridge() {
		return this._envBridge;
	}

	getServerSettingBridge() {
		return this._setsBridge;
	}
}

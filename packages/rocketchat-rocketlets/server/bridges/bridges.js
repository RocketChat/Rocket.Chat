import { RocketletBridges } from 'temporary-rocketlets-server/server/bridges';
import { RocketletCommandsBridge } from './commands';
import { RocketletEnvironmentalVariableBridge } from './environmental';
import { RocketletSettingBridge } from './settings';

export class RealRocketletBridges extends RocketletBridges {
	constructor(converters) {
		super();

		this._cmdBridge = new RocketletCommandsBridge(converters);
		this._envBridge = new RocketletEnvironmentalVariableBridge(converters);
		this._setsBridge = new RocketletSettingBridge(converters);
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

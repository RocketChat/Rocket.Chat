import { RocketletBridges } from 'temporary-rocketlets-server/server/bridges';
import { RocketletCommandsBridge } from './commands';
import { RocketletEnvironmentalVariableBridge } from './environmental';
import { RocketletMessageBridge } from './messages';
import { RocketletPersistenceBridge } from './persistence';
import { RocketletRoomBridge } from './rooms';
import { RocketletSettingBridge } from './settings';
import { RocketletUserBridge } from './users';

export class RealRocketletBridges extends RocketletBridges {
	constructor(orch) {
		super();

		this._cmdBridge = new RocketletCommandsBridge(orch);
		this._envBridge = new RocketletEnvironmentalVariableBridge(orch);
		this._msgBridge = new RocketletMessageBridge(orch);
		this._persistBridge = new RocketletPersistenceBridge(orch);
		this._roomBridge = new RocketletRoomBridge(orch);
		this._setsBridge = new RocketletSettingBridge(orch);
		this._userBridge = new RocketletUserBridge(orch);
	}

	getCommandBridge() {
		return this._cmdBridge;
	}

	getEnvironmentalVariableBridge() {
		return this._envBridge;
	}

	getMessageBridge() {
		return this._msgBridge;
	}

	getPersistenceBridge() {
		return this._persistBridge;
	}

	getRoomBridge() {
		return this._roomBridge;
	}

	getServerSettingBridge() {
		return this._setsBridge;
	}

	getUserBridge() {
		return this._userBridge;
	}
}

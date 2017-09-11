import { RocketletBridges } from 'temporary-rocketlets-server/server/bridges';

import { RocketletActivationBridge } from './activation';
import { RocketletCommandsBridge } from './commands';
import { RocketletEnvironmentalVariableBridge } from './environmental';
import { RocketletHttpBridge } from './http';
import { RocketletMessageBridge } from './messages';
import { RocketletPersistenceBridge } from './persistence';
import { RocketletRoomBridge } from './rooms';
import { RocketletSettingBridge } from './settings';
import { RocketletUserBridge } from './users';

export class RealRocketletBridges extends RocketletBridges {
	constructor(orch) {
		super();

		this._actBridge = new RocketletActivationBridge(orch);
		this._cmdBridge = new RocketletCommandsBridge(orch);
		this._envBridge = new RocketletEnvironmentalVariableBridge(orch);
		this._httpBridge = new RocketletHttpBridge();
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

	getHttpBridge() {
		return this._httpBridge;
	}

	getMessageBridge() {
		return this._msgBridge;
	}

	getPersistenceBridge() {
		return this._persistBridge;
	}

	getRocketletActivationBridge() {
		return this._actBridge;
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

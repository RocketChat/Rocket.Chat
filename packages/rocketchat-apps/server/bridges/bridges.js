import { AppBridges } from '@rocket.chat/apps-engine/server/bridges';

import { AppActivationBridge } from './activation';
import { AppCommandsBridge } from './commands';
import { AppEnvironmentalVariableBridge } from './environmental';
import { AppHttpBridge } from './http';
import { AppMessageBridge } from './messages';
import { AppPersistenceBridge } from './persistence';
import { AppRoomBridge } from './rooms';
import { AppSettingBridge } from './settings';
import { AppUserBridge } from './users';

export class RealAppBridges extends AppBridges {
	constructor(orch) {
		super();

		this._actBridge = new AppActivationBridge(orch);
		this._cmdBridge = new AppCommandsBridge(orch);
		this._envBridge = new AppEnvironmentalVariableBridge(orch);
		this._httpBridge = new AppHttpBridge();
		this._msgBridge = new AppMessageBridge(orch);
		this._persistBridge = new AppPersistenceBridge(orch);
		this._roomBridge = new AppRoomBridge(orch);
		this._setsBridge = new AppSettingBridge(orch);
		this._userBridge = new AppUserBridge(orch);
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

	getAppActivationBridge() {
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

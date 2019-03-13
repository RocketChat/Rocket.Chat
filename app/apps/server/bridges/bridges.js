import { AppBridges } from '@rocket.chat/apps-engine/server/bridges';

import { AppActivationBridge } from './activation';
import { AppDetailChangesBridge } from './details';
import { AppCommandsBridge } from './commands';
import { AppApisBridge } from './api';
import { AppEnvironmentalVariableBridge } from './environmental';
import { AppHttpBridge } from './http';
import { AppListenerBridge } from './listeners';
import { AppMessageBridge } from './messages';
import { AppPersistenceBridge } from './persistence';
import { AppRoomBridge } from './rooms';
import { AppInternalBridge } from './internal';
import { AppSettingBridge } from './settings';
import { AppUserBridge } from './users';

export class RealAppBridges extends AppBridges {
	constructor(orch) {
		super();

		this._actBridge = new AppActivationBridge(orch);
		this._cmdBridge = new AppCommandsBridge(orch);
		this._apiBridge = new AppApisBridge(orch);
		this._detBridge = new AppDetailChangesBridge(orch);
		this._envBridge = new AppEnvironmentalVariableBridge(orch);
		this._httpBridge = new AppHttpBridge();
		this._lisnBridge = new AppListenerBridge(orch);
		this._msgBridge = new AppMessageBridge(orch);
		this._persistBridge = new AppPersistenceBridge(orch);
		this._roomBridge = new AppRoomBridge(orch);
		this._internalBridge = new AppInternalBridge(orch);
		this._setsBridge = new AppSettingBridge(orch);
		this._userBridge = new AppUserBridge(orch);
	}

	getCommandBridge() {
		return this._cmdBridge;
	}

	getApiBridge() {
		return this._apiBridge;
	}

	getEnvironmentalVariableBridge() {
		return this._envBridge;
	}

	getHttpBridge() {
		return this._httpBridge;
	}

	getListenerBridge() {
		return this._lisnBridge;
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

	getAppDetailChangesBridge() {
		return this._detBridge;
	}

	getRoomBridge() {
		return this._roomBridge;
	}

	getInternalBridge() {
		return this._internalBridge;
	}

	getServerSettingBridge() {
		return this._setsBridge;
	}

	getUserBridge() {
		return this._userBridge;
	}
}

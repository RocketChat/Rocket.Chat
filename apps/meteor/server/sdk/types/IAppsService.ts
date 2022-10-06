import type { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import type { AppManager } from '@rocket.chat/apps-engine/server/AppManager';
import type { ProxiedApp } from '@rocket.chat/apps-engine/server/ProxiedApp';
import type { SettingValue } from '@rocket.chat/core-typings';

import type { RealAppBridges } from '../../services/apps/bridges';
import type { AppsPersistenceModel } from '../../../app/models/server';

export interface IAppsService {
	triggerEvent: (event: string, payload: Record<string, any>) => Promise<any>;
	updateAppsMarketplaceInfo: (apps: Array<IAppInfo>) => Promise<ProxiedApp[] | undefined>;
	initialize: () => void;
	load: () => Promise<void>;
	unload: () => Promise<void>;
	isLoaded: () => boolean;
	isEnabled: () => SettingValue;
	isInitialized: () => boolean;
	getBridges: () => RealAppBridges | undefined;
	getManager: () => AppManager | undefined;
	getPersistenceModel: () => AppsPersistenceModel;
}

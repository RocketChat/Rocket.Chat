import type { Logger } from '@rocket.chat/logger';
import type { IAppsPersistenceModel } from '@rocket.chat/model-typings';

import type { AppBridges, AppEvents, AppMetadataStorage } from './AppsEngine.js';
import type { IAppServerNotifier } from './IAppServerNotifier.js';
import type { IAppConvertersMap } from './converters/index.js';
import type { AppManager } from './server/AppManager.js';
import type { AppSourceStorage } from './server/storage/index.js';

export interface IAppServerOrchestrator {
	initialize(): void;
	isInitialized(): boolean;
	isLoaded(): boolean;
	getNotifier(): IAppServerNotifier;
	isDebugging(): boolean;
	debugLog(...args: any[]): void;
	getManager(): AppManager;
	getConverters(): IAppConvertersMap;
	getPersistenceModel(): IAppsPersistenceModel;
	getRocketChatLogger(): Logger;
	triggerEvent(event: AppEvents, ...payload: any[]): Promise<any>;
	getBridges(): AppBridges;
	getStorage(): AppMetadataStorage;
	getAppSourceStorage(): AppSourceStorage;
}

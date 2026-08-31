import type { Logger } from '@rocket.chat/logger';
import type { IAppsPersistenceModel } from '@rocket.chat/model-typings';

import type { AppBridges, AppEvents, AppMetadataStorage } from './AppsEngine';
import type { IAppServerNotifier } from './IAppServerNotifier';
import type { IAppConvertersMap } from './converters';
import type { AppManager } from './server/AppManager';
import type { AppSourceStorage } from './server/storage';

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

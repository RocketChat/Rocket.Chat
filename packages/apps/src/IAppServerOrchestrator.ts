import type { AppManager } from '@rocket.chat/apps-engine/server/AppManager';
import type { Logger } from '@rocket.chat/logger';
import type { IAppsPersistenceModel } from '@rocket.chat/model-typings';

import type { IAppServerNotifier } from './IAppServerNotifier';
import type { IAppConvertersMap } from './converters';

export interface IAppServerOrchestrator {
	initialize(): void;
	getNotifier(): IAppServerNotifier;
	isDebugging(): boolean;
	debugLog(...args: any[]): void;
	getManager(): AppManager;
	getConverters(): IAppConvertersMap;
	getPersistenceModel(): IAppsPersistenceModel;
	getRocketChatLogger(): Logger;
}

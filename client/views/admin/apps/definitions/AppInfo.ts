import { IApiEndpointMetadata } from '@rocket.chat/apps-engine/definition/api';
import { AppSettingsManager } from '@rocket.chat/apps-engine/server/managers/AppSettingsManager';

import { App } from '../types';

export type AppInfo = App & {
	settings: ReturnType<AppSettingsManager['getAppSettings']>;
	apis: Array<IApiEndpointMetadata>;
};

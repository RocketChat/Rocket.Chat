import { IApiEndpointMetadata } from '@rocket.chat/apps-engine/definition/api';
import { AppSettingsManager } from '@rocket.chat/apps-engine/server/managers/AppSettingsManager';
import { AppScreenshot } from '@rocket.chat/core-typings';

import { App } from '../types';

export type AppInfo = App & {
	settings: ReturnType<AppSettingsManager['getAppSettings']>;
	apis: Array<IApiEndpointMetadata>;
	screenshots: Array<AppScreenshot>;
};

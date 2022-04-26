import { IApiEndpointMetadata } from '@rocket.chat/apps-engine/definition/api';
import { AppSettingsManager } from '@rocket.chat/apps-engine/server/managers/AppSettingsManager';

import { App } from '../types';

export type Screenshot = {
	id: string;
	appId: string;
	fileName: string;
	accessUrl: string;
	thumbnailUrl: string;
	createdAt: string;
	modifiedAt: string;
};

export type AppInfo = App & {
	settings: ReturnType<AppSettingsManager['getAppSettings']>;
	apis: Array<IApiEndpointMetadata>;
	screenshots: Array<Screenshot>;
};

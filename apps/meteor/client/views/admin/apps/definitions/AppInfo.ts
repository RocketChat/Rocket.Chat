import { IApiEndpointMetadata } from '@rocket.chat/apps-engine/definition/api';
import { AppScreenshot } from '@rocket.chat/core-typings';

import { ISettings } from '../../../../../app/apps/client/@types/IOrchestrator';
import { App } from '../types';

export type AppInfo = App & {
	settings?: ISettings;
	apis: Array<IApiEndpointMetadata>;
	screenshots: Array<AppScreenshot>;
};

import type { IApiEndpointMetadata } from '@rocket.chat/apps-engine/definition/api';
import type { AppScreenshot } from '@rocket.chat/core-typings';

import type { ISettings } from './ISettings';
import type { App } from '../types';

export type AppInfo = App & {
	settings?: ISettings;
	apis: Array<IApiEndpointMetadata>;
	screenshots: Array<AppScreenshot>;
};

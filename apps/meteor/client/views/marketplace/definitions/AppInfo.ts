import type { IApiEndpointMetadata } from '@rocket.chat/apps-engine/definition/api';
import type { AppScreenshot, App } from '@rocket.chat/core-typings';

import type { ISettings } from '../../../apps/@types/IOrchestrator';

export type AppInfo = App & {
	settings?: ISettings;
	apis: Array<IApiEndpointMetadata>;
	screenshots: Array<AppScreenshot>;
};

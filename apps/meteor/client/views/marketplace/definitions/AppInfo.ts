import type { IApiEndpointMetadata } from '@rocket.chat/apps-engine/definition/api';
import type { AppScreenshot } from '@rocket.chat/core-typings';

import type { ISettings } from '../../../../ee/client/apps/@types/IOrchestrator';
import type { App } from '../types';

export type AppInfo = App & {
	settings?: ISettings;
	apis: Array<IApiEndpointMetadata>;
	screenshots: Array<AppScreenshot>;
};

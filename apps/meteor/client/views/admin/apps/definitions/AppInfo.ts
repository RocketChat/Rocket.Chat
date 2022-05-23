import { IApiEndpointMetadata } from '@rocket.chat/apps-engine/definition/api';

import { ISettingsReturn } from '../../../../../app/apps/client/@types/IOrchestrator';
import { App } from '../types';

export type AppInfo = App & {
	settings?: ISettingsReturn;
	apis: Array<IApiEndpointMetadata>;
};

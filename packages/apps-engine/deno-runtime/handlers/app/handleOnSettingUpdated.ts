import type { App } from '@rocket.chat/apps-engine/definition/App.ts';
import type { RequestObject } from 'jsonrpc-lite';

import { AppObjectRegistry } from '../../AppObjectRegistry.ts';
import { AppAccessorsInstance } from '../../lib/accessors/mod.ts';

export default async function handleOnSettingUpdated(request: RequestObject): Promise<boolean> {
	const { params } = request;
	const app = AppObjectRegistry.get<App>('app');

	if (typeof app?.onSettingUpdated !== 'function') {
		throw new Error('App must contain an onSettingUpdated function', {
			cause: 'invalid_app',
		});
	}

	if (!Array.isArray(params)) {
		throw new Error('Invalid params', { cause: 'invalid_param_type' });
	}

	const [setting] = params as [Record<string, unknown>];

	await app.onSettingUpdated(setting, AppAccessorsInstance.getConfigurationModify(), AppAccessorsInstance.getReader(), AppAccessorsInstance.getHttp());

	return true;
}

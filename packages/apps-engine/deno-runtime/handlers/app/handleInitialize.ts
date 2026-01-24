import type { App } from '@rocket.chat/apps-engine/definition/App.ts';
import type { RequestObject } from 'jsonrpc-lite';

import { AppObjectRegistry } from '../../AppObjectRegistry.ts';
import { AppAccessorsInstance } from '../../lib/accessors/mod.ts';

export default async function handleInitialize(_request: RequestObject): Promise<boolean> {
	const app = AppObjectRegistry.get<App>('app');

	if (typeof app?.initialize !== 'function') {
		throw new Error('App must contain an initialize function', {
			cause: 'invalid_app',
		});
	}

	await app.initialize(AppAccessorsInstance.getConfigurationExtend(), AppAccessorsInstance.getEnvironmentRead());

	return true;
}

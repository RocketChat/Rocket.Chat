import type { App } from '@rocket.chat/apps-engine/definition/App.ts';
import type { RequestObject } from 'jsonrpc-lite';

import { AppObjectRegistry } from '../../AppObjectRegistry.ts';
import { AppAccessorsInstance } from '../../lib/accessors/mod.ts';

export default function handleOnEnable(_request: RequestObject): Promise<boolean> {
	const app = AppObjectRegistry.get<App>('app');

	if (typeof app?.onEnable !== 'function') {
		throw new Error('App must contain an onEnable function', {
			cause: 'invalid_app',
		});
	}

	return app.onEnable(AppAccessorsInstance.getEnvironmentRead(), AppAccessorsInstance.getConfigurationModify());
}

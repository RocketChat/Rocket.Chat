import type { App } from '@rocket.chat/apps-engine/definition/App.js';
import type { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus.js';

import { AppObjectRegistry } from '../../AppObjectRegistry.js';

export default function handleGetStatus(): Promise<AppStatus> {
	const app = AppObjectRegistry.get<App>('app');

	if (typeof app?.getStatus !== 'function') {
		throw new Error('App must contain a getStatus function', {
			cause: 'invalid_app',
		});
	}

	return app.getStatus();
}

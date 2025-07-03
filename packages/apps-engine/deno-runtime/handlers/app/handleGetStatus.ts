import type { App } from '@rocket.chat/apps-engine/definition/App.ts';
import type { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus.ts';

import { AppObjectRegistry } from '../../AppObjectRegistry.ts';

export default function handleGetStatus(): Promise<AppStatus> {
	const app = AppObjectRegistry.get<App>('app');

	if (typeof app?.getStatus !== 'function') {
		throw new Error('App must contain a getStatus function', {
			cause: 'invalid_app',
		});
	}

	return app.getStatus();
}

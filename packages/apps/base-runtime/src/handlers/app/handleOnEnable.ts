import type { App } from '@rocket.chat/apps-engine/definition/App';

import { AppObjectRegistry } from '../../AppObjectRegistry';
import { AppAccessorsInstance } from '../../lib/accessors/mod';
import type { RequestContext } from '../../lib/requestContext';
import { wrapAppForRequest } from '../../lib/wrapAppForRequest';

export default function handleOnEnable(request: RequestContext): Promise<boolean> {
	const app = AppObjectRegistry.get<App>('app');

	if (typeof app?.onEnable !== 'function') {
		throw new Error('App must contain an onEnable function', {
			cause: 'invalid_app',
		});
	}

	// oxlint-disable-next-line typescript/no-unsafe-return -- Function.prototype.call returns any because strictBindCallApply is off in this package; the value is the app's onEnable result
	return app.onEnable.call(
		wrapAppForRequest(app, request),
		AppAccessorsInstance.getEnvironmentRead(),
		AppAccessorsInstance.getConfigurationModify(),
	);
}

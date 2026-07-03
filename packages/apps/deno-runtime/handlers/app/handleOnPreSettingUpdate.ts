import type { App } from '@rocket.chat/apps-engine/definition/App';

import { AppObjectRegistry } from '../../AppObjectRegistry';
import { AppAccessorsInstance } from '../../lib/accessors/mod';
import { RequestContext } from '../../lib/requestContext';
import { wrapAppForRequest } from '../../lib/wrapAppForRequest';

export default function handleOnPreSettingUpdate(request: RequestContext): Promise<object> {
	const { params } = request;
	const app = AppObjectRegistry.get<App>('app');

	if (typeof app?.onPreSettingUpdate !== 'function') {
		throw new Error('App must contain an onPreSettingUpdate function', {
			cause: 'invalid_app',
		});
	}

	if (!Array.isArray(params)) {
		throw new Error('Invalid params', { cause: 'invalid_param_type' });
	}

	const [setting] = params as [Record<string, unknown>];

	return app.onPreSettingUpdate.call(
		wrapAppForRequest(app, request),
		setting,
		AppAccessorsInstance.getConfigurationModify(),
		AppAccessorsInstance.getReader(),
		AppAccessorsInstance.getHttp(),
	);
}

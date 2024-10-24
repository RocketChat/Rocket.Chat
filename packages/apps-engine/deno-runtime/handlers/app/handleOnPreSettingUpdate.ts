import type { App } from '@rocket.chat/apps-engine/definition/App.ts';

import { AppObjectRegistry } from '../../AppObjectRegistry.ts';
import { AppAccessorsInstance } from '../../lib/accessors/mod.ts';

export default function handleOnPreSettingUpdate(params: unknown): Promise<object> {
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

    return app.onPreSettingUpdate(setting, AppAccessorsInstance.getConfigurationModify(), AppAccessorsInstance.getReader(), AppAccessorsInstance.getHttp());
}

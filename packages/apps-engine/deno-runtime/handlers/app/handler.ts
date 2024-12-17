import type { App } from '@rocket.chat/apps-engine/definition/App.ts';
import { Defined, JsonRpcError } from 'jsonrpc-lite';

import handleConstructApp from './construct.ts';
import handleInitialize from './handleInitialize.ts';
import handleGetStatus from './handleGetStatus.ts';
import handleSetStatus from './handleSetStatus.ts';
import handleOnEnable from './handleOnEnable.ts';
import handleOnInstall from './handleOnInstall.ts';
import handleOnDisable from './handleOnDisable.ts';
import handleOnUninstall from './handleOnUninstall.ts';
import handleOnPreSettingUpdate from './handleOnPreSettingUpdate.ts';
import handleOnSettingUpdated from './handleOnSettingUpdated.ts';
import handleListener from '../listener/handler.ts';
import handleUIKitInteraction, { uikitInteractions } from '../uikit/handler.ts';
import { AppObjectRegistry } from '../../AppObjectRegistry.ts';
import handleOnUpdate from './handleOnUpdate.ts';

export default async function handleApp(method: string, params: unknown): Promise<Defined | JsonRpcError> {
    const [, appMethod] = method.split(':');

    try {
        // We don't want the getStatus method to generate logs, so we handle it separately
        if (appMethod === 'getStatus') {
            return await handleGetStatus();
        }

        // `app` will be undefined if the method here is "app:construct"
        const app = AppObjectRegistry.get<App>('app');

        app?.getLogger().debug(`'${appMethod}' is being called...`);

        if (uikitInteractions.includes(appMethod)) {
            return handleUIKitInteraction(appMethod, params).then((result) => {
                if (result instanceof JsonRpcError) {
                    app?.getLogger().debug(`'${appMethod}' was unsuccessful.`, result.message);
                } else {
                    app?.getLogger().debug(`'${appMethod}' was successfully called! The result is:`, result);
                }

                return result;
            });
        }

        if (appMethod.startsWith('check') || appMethod.startsWith('execute')) {
            return handleListener(appMethod, params).then((result) => {
                if (result instanceof JsonRpcError) {
                    app?.getLogger().debug(`'${appMethod}' was unsuccessful.`, result.message);
                } else {
                    app?.getLogger().debug(`'${appMethod}' was successfully called! The result is:`, result);
                }

                return result;
            });
        }

        let result: Defined | JsonRpcError;

        switch (appMethod) {
            case 'construct':
                result = await handleConstructApp(params);
                break;
            case 'initialize':
                result = await handleInitialize();
                break;
            case 'setStatus':
                result = await handleSetStatus(params);
                break;
            case 'onEnable':
                result = await handleOnEnable();
                break;
            case 'onDisable':
                result = await handleOnDisable();
                break;
            case 'onInstall':
                result = await handleOnInstall(params);
                break;
            case 'onUninstall':
                result = await handleOnUninstall(params);
                break;
            case 'onPreSettingUpdate':
                result = await handleOnPreSettingUpdate(params);
                break;
            case 'onSettingUpdated':
                result = await handleOnSettingUpdated(params);
                break;
            case 'onUpdate':
                result = await handleOnUpdate(params);
                break;
            default:
                throw new JsonRpcError('Method not found', -32601);
        }

        app?.getLogger().debug(`'${appMethod}' was successfully called! The result is:`, result);

        return result;
    } catch (e: unknown) {
        if (!(e instanceof Error)) {
            return new JsonRpcError('Unknown error', -32000, e);
        }

        if ((e.cause as string)?.includes('invalid_param_type')) {
            return JsonRpcError.invalidParams(null);
        }

        if ((e.cause as string)?.includes('invalid_app')) {
            return JsonRpcError.internalError({ message: 'App unavailable' });
        }

        return new JsonRpcError(e.message, -32000, e);
    }
}

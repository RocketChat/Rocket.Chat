import { Defined, JsonRpcError } from 'jsonrpc-lite';
import type { App } from '@rocket.chat/apps-engine/definition/App.ts';

import { require } from '../../lib/require.ts';
import { AppObjectRegistry } from '../../AppObjectRegistry.ts';
import { AppAccessorsInstance } from '../../lib/accessors/mod.ts';

export const uikitInteractions = [
    'executeBlockActionHandler',
    'executeViewSubmitHandler',
    'executeViewClosedHandler',
    'executeActionButtonHandler',
    'executeLivechatBlockActionHandler',
];

export const {
    UIKitBlockInteractionContext,
    UIKitViewSubmitInteractionContext,
    UIKitViewCloseInteractionContext,
    UIKitActionButtonInteractionContext,
} = require('@rocket.chat/apps-engine/definition/uikit/UIKitInteractionContext.js');

export const { UIKitLivechatBlockInteractionContext } = require('@rocket.chat/apps-engine/definition/uikit/livechat/UIKitLivechatInteractionContext.js');

export default async function handleUIKitInteraction(method: string, params: unknown): Promise<Defined | JsonRpcError> {
    if (!uikitInteractions.includes(method)) {
        return JsonRpcError.methodNotFound(null);
    }

    if (!Array.isArray(params)) {
        return JsonRpcError.invalidParams(null);
    }

    const app = AppObjectRegistry.get<App>('app');

    const interactionHandler = app?.[method as keyof App] as unknown;

    if (!app || typeof interactionHandler !== 'function') {
        return JsonRpcError.methodNotFound({
            message: `App does not implement method "${method}"`,
        });
    }

    const [payload] = params as [Record<string, unknown>];

    if (!payload) {
        return JsonRpcError.invalidParams(null);
    }

    let context;

    switch (method) {
        case 'executeBlockActionHandler':
            context = new UIKitBlockInteractionContext(payload);
            break;
        case 'executeViewSubmitHandler':
            context = new UIKitViewSubmitInteractionContext(payload);
            break;
        case 'executeViewClosedHandler':
            context = new UIKitViewCloseInteractionContext(payload);
            break;
        case 'executeActionButtonHandler':
            context = new UIKitActionButtonInteractionContext(payload);
            break;
        case 'executeLivechatBlockActionHandler':
            context = new UIKitLivechatBlockInteractionContext(payload);
            break;
    }

    try {
        return await interactionHandler.call(
            app,
            context,
            AppAccessorsInstance.getReader(),
            AppAccessorsInstance.getHttp(),
            AppAccessorsInstance.getPersistence(),
            AppAccessorsInstance.getModifier(),
        );
    } catch (e) {
        return JsonRpcError.internalError({ message: e.message });
    }
}

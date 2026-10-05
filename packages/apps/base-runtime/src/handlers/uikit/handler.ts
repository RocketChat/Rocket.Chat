import type { App } from '@rocket.chat/apps-engine/definition/App';
import type {
	IUIKitBlockIncomingInteraction,
	IUIKitViewSubmitIncomingInteraction,
	IUIKitViewCloseIncomingInteraction,
	IUIKitActionButtonIncomingInteraction,
} from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionTypes';
import {
	UIKitBlockInteractionContext,
	UIKitViewSubmitInteractionContext,
	UIKitViewCloseInteractionContext,
	UIKitActionButtonInteractionContext,
} from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionContext';
import type { IUIKitLivechatBlockIncomingInteraction } from '@rocket.chat/apps-engine/definition/uikit/livechat/UIKitLivechatIncomingInteractionType';
import { UIKitLivechatBlockInteractionContext } from '@rocket.chat/apps-engine/definition/uikit/livechat/UIKitLivechatInteractionContext';

import { AppObjectRegistry } from '../../AppObjectRegistry';
import { AppAccessorsInstance } from '../../lib/accessors/mod';
import { JsonRpcError, type Defined } from '../../lib/jsonrpc';
import type { RequestContext } from '../../lib/requestContext';
import { wrapAppForRequest } from '../../lib/wrapAppForRequest';
import { isOneOf } from '../lib/assertions';

export const uikitInteractions = [
	'executeBlockActionHandler',
	'executeViewSubmitHandler',
	'executeViewClosedHandler',
	'executeActionButtonHandler',
	'executeLivechatBlockActionHandler',
] as const;

export {
	UIKitBlockInteractionContext,
	UIKitViewSubmitInteractionContext,
	UIKitViewCloseInteractionContext,
	UIKitActionButtonInteractionContext,
	UIKitLivechatBlockInteractionContext,
};

export default async function handleUIKitInteraction(request: RequestContext): Promise<Defined | JsonRpcError> {
	const { method: reqMethod, params } = request;
	const [, method] = reqMethod.split(':');

	if (!isOneOf(method, uikitInteractions)) {
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
			context = new UIKitBlockInteractionContext(payload as unknown as IUIKitBlockIncomingInteraction);
			break;
		case 'executeViewSubmitHandler':
			context = new UIKitViewSubmitInteractionContext(payload as unknown as IUIKitViewSubmitIncomingInteraction);
			break;
		case 'executeViewClosedHandler':
			context = new UIKitViewCloseInteractionContext(payload as unknown as IUIKitViewCloseIncomingInteraction);
			break;
		case 'executeActionButtonHandler':
			context = new UIKitActionButtonInteractionContext(payload as unknown as IUIKitActionButtonIncomingInteraction);
			break;
		case 'executeLivechatBlockActionHandler':
			context = new UIKitLivechatBlockInteractionContext(payload as unknown as IUIKitLivechatBlockIncomingInteraction);
			break;
	}

	try {
		return await interactionHandler.call(
			wrapAppForRequest(app, request),
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

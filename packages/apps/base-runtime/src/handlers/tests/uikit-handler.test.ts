import * as assert from 'node:assert';
import { after, beforeEach, describe, it } from 'node:test';

import { AppObjectRegistry } from '../../AppObjectRegistry';
import jsonrpc, { type Defined } from '../../lib/jsonrpc';
import { Logger } from '../../lib/logger';
import type { RequestContext } from '../../lib/requestContext';
import handleUIKitInteraction, {
	UIKitActionButtonInteractionContext,
	UIKitBlockInteractionContext,
	UIKitBlockSuggestionInteractionContext,
	UIKitLivechatBlockInteractionContext,
	UIKitLivechatViewCloseInteractionContext,
	UIKitLivechatViewSubmitInteractionContext,
	UIKitViewCloseInteractionContext,
	UIKitViewSubmitInteractionContext,
} from '../uikit/handler';

function makeMockRequest(method: string, payload: { [k: string]: Defined }): RequestContext {
	return Object.assign(jsonrpc.request(1, method, [payload]), {
		context: {
			logger: new Logger(method),
		},
	});
}

describe('handlers > uikit', () => {
	const mockApp = {
		getID: (): string => 'appId',
		executeBlockActionHandler: (context: any): Promise<any> => Promise.resolve(context),
		executeBlockSuggestionHandler: (context: any): Promise<any> => Promise.resolve(context),
		executeViewSubmitHandler: (context: any): Promise<any> => Promise.resolve(context),
		executeViewClosedHandler: (context: any): Promise<any> => Promise.resolve(context),
		executeActionButtonHandler: (context: any): Promise<any> => Promise.resolve(context),
		executeLivechatBlockActionHandler: (context: any): Promise<any> => Promise.resolve(context),
		executeLivechatViewSubmitHandler: (context: any): Promise<any> => Promise.resolve(context),
		executeLivechatViewClosedHandler: (context: any): Promise<any> => Promise.resolve(context),
	};

	beforeEach(() => {
		AppObjectRegistry.set('app', mockApp);
	});

	after(() => {
		AppObjectRegistry.clear();
	});

	it('successfully handles a call for "executeBlockActionHandler"', async () => {
		const request = makeMockRequest('app:executeBlockActionHandler', {
			actionId: 'actionId',
			blockId: 'blockId',
			value: 'value',
			viewId: 'viewId',
		});

		const result = await handleUIKitInteraction(request);
		assert.ok(result instanceof UIKitBlockInteractionContext, `Expected instance of ${UIKitBlockInteractionContext.name}`);
	});

	it('successfully handles a call for "executeBlockSuggestionHandler"', async () => {
		const request = makeMockRequest('app:executeBlockSuggestionHandler', {
			actionId: 'actionId',
			blockId: 'blockId',
			value: 'qu',
		});

		const result = await handleUIKitInteraction(request);
		assert.ok(
			result instanceof UIKitBlockSuggestionInteractionContext,
			`Expected instance of ${UIKitBlockSuggestionInteractionContext.name}`,
		);
	});

	it('successfully handles a call for "executeViewSubmitHandler"', async () => {
		const request = makeMockRequest('app:executeViewSubmitHandler', {
			viewId: 'viewId',
			appId: 'appId',
			userId: 'userId',
			isAppUser: true,
			values: {},
		});

		const result = await handleUIKitInteraction(request);
		assert.ok(result instanceof UIKitViewSubmitInteractionContext, `Expected instance of ${UIKitViewSubmitInteractionContext.name}`);
	});

	it('successfully handles a call for "executeViewClosedHandler"', async () => {
		const request = makeMockRequest('app:executeViewClosedHandler', {
			viewId: 'viewId',
			appId: 'appId',
			userId: 'userId',
			isAppUser: true,
		});

		const result = await handleUIKitInteraction(request);
		assert.ok(result instanceof UIKitViewCloseInteractionContext, `Expected instance of ${UIKitViewCloseInteractionContext.name}`);
	});

	it('successfully handles a call for "executeActionButtonHandler"', async () => {
		const request = makeMockRequest('app:executeActionButtonHandler', {
			actionId: 'actionId',
			appId: 'appId',
			userId: 'userId',
			isAppUser: true,
		});

		const result = await handleUIKitInteraction(request);
		assert.ok(result instanceof UIKitActionButtonInteractionContext, `Expected instance of ${UIKitActionButtonInteractionContext.name}`);
	});

	it('successfully handles a call for "executeLivechatBlockActionHandler"', async () => {
		const request = makeMockRequest('app:executeLivechatBlockActionHandler', {
			actionId: 'actionId',
			appId: 'appId',
			userId: 'userId',
			visitor: {},
			isAppUser: true,
			room: {},
		});

		const result = await handleUIKitInteraction(request);
		assert.ok(result instanceof UIKitLivechatBlockInteractionContext, `Expected instance of ${UIKitLivechatBlockInteractionContext.name}`);
	});

	it('successfully handles a call for "executeLivechatViewSubmitHandler"', async () => {
		const request = makeMockRequest('app:executeLivechatViewSubmitHandler', {
			appId: 'appId',
			visitor: {},
			view: {},
			triggerId: 'triggerId',
		});

		const result = await handleUIKitInteraction(request);
		assert.ok(
			result instanceof UIKitLivechatViewSubmitInteractionContext,
			`Expected instance of ${UIKitLivechatViewSubmitInteractionContext.name}`,
		);
	});

	it('successfully handles a call for "executeLivechatViewClosedHandler"', async () => {
		const request = makeMockRequest('app:executeLivechatViewClosedHandler', { appId: 'appId', visitor: {}, view: {}, isCleared: false });

		const result = await handleUIKitInteraction(request);
		assert.ok(
			result instanceof UIKitLivechatViewCloseInteractionContext,
			`Expected instance of ${UIKitLivechatViewCloseInteractionContext.name}`,
		);
	});
});

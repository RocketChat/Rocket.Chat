// deno-lint-ignore-file no-explicit-any
import { assertInstanceOf } from 'https://deno.land/std@0.203.0/assert/mod.ts';
import { afterAll, beforeEach, describe, it } from 'https://deno.land/std@0.203.0/testing/bdd.ts';
import jsonrpc from 'jsonrpc-lite';

import { AppObjectRegistry } from '../../AppObjectRegistry.ts';
import handleUIKitInteraction, {
	UIKitActionButtonInteractionContext,
	UIKitBlockInteractionContext,
	UIKitLivechatBlockInteractionContext,
	UIKitViewCloseInteractionContext,
	UIKitViewSubmitInteractionContext,
} from '../uikit/handler.ts';

describe('handlers > uikit', () => {
	const mockApp = {
		getID: (): string => 'appId',
		executeBlockActionHandler: (context: any): Promise<any> => Promise.resolve(context),
		executeViewSubmitHandler: (context: any): Promise<any> => Promise.resolve(context),
		executeViewClosedHandler: (context: any): Promise<any> => Promise.resolve(context),
		executeActionButtonHandler: (context: any): Promise<any> => Promise.resolve(context),
		executeLivechatBlockActionHandler: (context: any): Promise<any> => Promise.resolve(context),
	};

	beforeEach(() => {
		AppObjectRegistry.set('app', mockApp);
	});

	afterAll(() => {
		AppObjectRegistry.clear();
	});

	it('successfully handles a call for "executeBlockActionHandler"', async () => {
		const request = jsonrpc.request(1, 'app:executeBlockActionHandler', [
			{
				actionId: 'actionId',
				blockId: 'blockId',
				value: 'value',
				viewId: 'viewId',
			},
		]);

		const result = await handleUIKitInteraction(request);
		assertInstanceOf(result, UIKitBlockInteractionContext);
	});

	it('successfully handles a call for "executeViewSubmitHandler"', async () => {
		const request = jsonrpc.request(1, 'app:executeViewSubmitHandler', [
			{
				viewId: 'viewId',
				appId: 'appId',
				userId: 'userId',
				isAppUser: true,
				values: {},
			},
		]);

		const result = await handleUIKitInteraction(request);
		assertInstanceOf(result, UIKitViewSubmitInteractionContext);
	});

	it('successfully handles a call for "executeViewClosedHandler"', async () => {
		const request = jsonrpc.request(1, 'app:executeViewClosedHandler', [
			{
				viewId: 'viewId',
				appId: 'appId',
				userId: 'userId',
				isAppUser: true,
			},
		]);

		const result = await handleUIKitInteraction(request);
		assertInstanceOf(result, UIKitViewCloseInteractionContext);
	});

	it('successfully handles a call for "executeActionButtonHandler"', async () => {
		const request = jsonrpc.request(1, 'app:executeActionButtonHandler', [
			{
				actionId: 'actionId',
				appId: 'appId',
				userId: 'userId',
				isAppUser: true,
			},
		]);

		const result = await handleUIKitInteraction(request);
		assertInstanceOf(result, UIKitActionButtonInteractionContext);
	});

	it('successfully handles a call for "executeLivechatBlockActionHandler"', async () => {
		const request = jsonrpc.request(1, 'app:executeLivechatBlockActionHandler', [
			{
				actionId: 'actionId',
				appId: 'appId',
				userId: 'userId',
				visitor: {},
				isAppUser: true,
				room: {},
			},
		]);

		const result = await handleUIKitInteraction(request);
		assertInstanceOf(result, UIKitLivechatBlockInteractionContext);
	});
});

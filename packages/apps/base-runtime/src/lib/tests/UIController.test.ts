import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import { UIKitInteractionResponder } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';

import { AppObjectRegistry } from '../../AppObjectRegistry';
import { UIController } from '../accessors/modify/UIController';
import type * as Messenger from '../messenger';

const context = { triggerId: 'trigger' };
const user = { id: 'user' } as never;
const view = { title: { type: 'plain_text', text: 'Step' }, blocks: [], external_id: 'step', private_metadata: 'a=1' } as never;

const setup = () => {
	AppObjectRegistry.set('id', 'app');
	const sent: unknown[][] = [];
	const sender = ((request: { params: unknown[] }) => {
		sent.push(request.params);
		return Promise.resolve({ result: undefined });
	}) as unknown as typeof Messenger.sendRequest;

	return { controller: new UIController(sender), sent };
};

describe('UIController view lifecycle', () => {
	it('pushes a modal, keeping the metadata the app sets', async () => {
		const { controller, sent } = setup();

		await controller.pushModalView(view, context, user);

		assert.deepStrictEqual(sent[0].slice(0, 1), [user]);
		const interaction = sent[0][1] as { type: string; view: Record<string, unknown> };
		assert.strictEqual(interaction.type, 'modal.push');
		assert.strictEqual(interaction.view.private_metadata, 'a=1');
		assert.strictEqual(interaction.view.external_id, 'step');
	});

	it('closes the modal it names', async () => {
		const { controller, sent } = setup();

		await controller.closeModalView('view', context, user);

		assert.deepStrictEqual(sent[0][1], { type: 'modal.close', triggerId: 'trigger', appId: 'app', viewId: 'view' });
	});

	it('clears the modals of the app', async () => {
		const { controller, sent } = setup();

		await controller.clearModalViews(context, user);

		assert.deepStrictEqual(sent[0][1], { type: 'modal.clear', triggerId: 'trigger', appId: 'app' });
	});
});

describe('UIKitInteractionResponder view lifecycle', () => {
	const responder = new UIKitInteractionResponder({ appId: 'app', triggerId: 'trigger' } as never);

	it('answers with a push', () => {
		const response = responder.pushModalViewResponse(view);

		assert.strictEqual(response.type, 'modal.push');
		assert.strictEqual(response.view.appId, 'app');
		assert.strictEqual(response.view.external_id, 'step');
	});

	it('answers with a clear', () => {
		assert.deepStrictEqual(responder.clearModalViewsResponse(), { success: true, type: 'modal.clear', triggerId: 'trigger', appId: 'app' });
	});

	it('answers with a close, with or without a view id', () => {
		assert.deepStrictEqual(responder.closeModalViewResponse('view'), {
			success: true,
			type: 'modal.close',
			triggerId: 'trigger',
			appId: 'app',
			viewId: 'view',
		});
		assert.strictEqual('viewId' in responder.closeModalViewResponse(), false);
	});
});

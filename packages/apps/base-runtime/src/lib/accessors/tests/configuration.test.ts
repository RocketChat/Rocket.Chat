import * as assert from 'node:assert';
import { after, beforeEach, describe, it, mock } from 'node:test';

import type { IApi } from '@rocket.chat/apps-engine/definition/api';

import { AppObjectRegistry } from '../../../AppObjectRegistry';
import { AppAccessors } from '../mod';

// The senderFn echoes the request as the SuccessObject `result`, so a bridge call resolves to the
// `{ method, params }` descriptor and the recorded spy shows exactly what was sent.
const senderFn = (r: any) =>
	Promise.resolve({
		id: 'test',
		jsonrpc: '2.0',
		result: r,
		serialize() {
			return JSON.stringify(this);
		},
	});

describe('ConfigurationExtend/Modify + app settings (base-runtime, via AppResourceBridge)', () => {
	beforeEach(() => {
		AppObjectRegistry.clear();
		AppObjectRegistry.set('id', 'deno-test');
		if (!AppObjectRegistry.has('apiEndpoints')) {
			AppObjectRegistry.set('apiEndpoints', []);
		}
	});

	after(() => {
		AppObjectRegistry.clear();
	});

	it('provideSlashCommand stashes the instance and calls doProvideSlashCommand', async () => {
		const spy = mock.fn(senderFn);
		const configExtend = new AppAccessors(spy).getConfigurationExtend();

		const command = { command: 'my-cmd', executor() {} } as any;
		await configExtend.slashCommands.provideSlashCommand(command);

		assert.strictEqual(AppObjectRegistry.get('slashcommand:my-cmd'), command);
		assert.strictEqual((spy.mock.calls[0].arguments[0] as any).method, 'bridges:getAppResourceBridge:doProvideSlashCommand');
		assert.strictEqual((spy.mock.calls[0].arguments[0] as any).params[1], 'APP_ID');
	});

	it('registerProcessors stashes each processor and calls doRegisterProcessors', async () => {
		const spy = mock.fn(senderFn);
		const configExtend = new AppAccessors(spy).getConfigurationExtend();

		await configExtend.scheduler.registerProcessors([{ id: 'p1' } as any, { id: 'p2' } as any]);

		assert.ok(AppObjectRegistry.get('scheduler:p1'));
		assert.ok(AppObjectRegistry.get('scheduler:p2'));
		assert.deepStrictEqual(spy.mock.calls[0].arguments, [
			{ method: 'bridges:getAppResourceBridge:doRegisterProcessors', params: [[{ id: 'p1' }, { id: 'p2' }], 'APP_ID'] },
		]);
	});

	it('provideApi stashes endpoints, calls doProvideApi, and then doListApis', async () => {
		const spy = mock.fn(senderFn);
		const configExtend = new AppAccessors(spy).getConfigurationExtend();

		const api = { endpoints: [{ path: 'hello', get() {} }] } as unknown as IApi;
		await configExtend.api.provideApi(api);

		assert.ok(AppObjectRegistry.get('api:hello'));
		assert.strictEqual((spy.mock.calls[0].arguments[0] as any).method, 'bridges:getAppResourceBridge:doProvideApi');
		// _availableMethods is computed locally before sending
		assert.deepStrictEqual((spy.mock.calls[0].arguments[0] as any).params[0].endpoints[0]._availableMethods, ['get']);
		assert.strictEqual((spy.mock.calls[1].arguments[0] as any).method, 'bridges:getAppResourceBridge:doListApis');
	});

	it('registerButton / provideSetting / externalComponents route to their bridge methods', async () => {
		const spy = mock.fn(senderFn);
		const configExtend = new AppAccessors(spy).getConfigurationExtend();

		await configExtend.ui.registerButton({ actionId: 'b1' } as any);
		await configExtend.settings.provideSetting({ id: 's1' } as any);
		await configExtend.externalComponents.register({ name: 'c1' } as any);

		assert.deepStrictEqual(
			spy.mock.calls.map((c) => (c.arguments[0] as any).method),
			[
				'bridges:getAppResourceBridge:doRegisterActionButton',
				'bridges:getAppResourceBridge:doProvideSetting',
				'bridges:getAppResourceBridge:doRegisterExternalComponent',
			],
		);
	});

	it('ConfigurationModify.slashCommands maps to modify/enable/disable bridge methods', async () => {
		const spy = mock.fn(senderFn);
		const configModify = new AppAccessors(spy).getConfigurationModify();

		await configModify.slashCommands.modifySlashCommand({ command: 'c', executor() {} } as any);
		await configModify.slashCommands.enableSlashCommand('c');
		await configModify.slashCommands.disableSlashCommand('c');

		assert.deepStrictEqual(
			spy.mock.calls.map((c) => (c.arguments[0] as any).method),
			[
				'bridges:getAppResourceBridge:doModifySlashCommand',
				'bridges:getAppResourceBridge:doEnableSlashCommand',
				'bridges:getAppResourceBridge:doDisableSlashCommand',
			],
		);
	});

	it('app-settings read/update go through the AppResourceBridge', async () => {
		const spy = mock.fn(senderFn);
		const accessors = new AppAccessors(spy);

		accessors.getEnvironmentRead().getSettings().getById('s1');
		await accessors.getEnvironmentWrite().getSettings().updateValue('s1', 'v');

		assert.deepStrictEqual(spy.mock.calls[0].arguments, [
			{ method: 'bridges:getAppResourceBridge:doGetSettingById', params: ['s1', 'APP_ID'] },
		]);
		assert.deepStrictEqual(spy.mock.calls[1].arguments, [
			{ method: 'bridges:getAppResourceBridge:doUpdateSettingValue', params: ['s1', 'v', 'APP_ID'] },
		]);
	});
});

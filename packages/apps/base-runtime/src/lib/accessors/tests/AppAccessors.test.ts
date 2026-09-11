/* eslint-disable @typescript-eslint/no-non-null-assertion -- acceptable in this test file */
/* eslint-disable testing-library/no-await-sync-queries */
import * as assert from 'node:assert';
import { after, beforeEach, describe, it, mock } from 'node:test';

import type { IRead, IModify, IHttp, IPersistence } from '@rocket.chat/apps-engine/definition/accessors';
import type { SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';

import { AppObjectRegistry } from '../../../AppObjectRegistry';
import { AppAccessors } from '../mod';

describe('AppAccessors', () => {
	let appAccessors: AppAccessors;

	const senderFn = (r: object) =>
		Promise.resolve({
			id: Math.random().toString(36).substring(2),
			jsonrpc: '2.0',
			result: r,
			serialize() {
				return JSON.stringify(this);
			},
		});

	beforeEach(() => {
		appAccessors = new AppAccessors(senderFn);
		AppObjectRegistry.clear();
	});

	after(() => {
		AppObjectRegistry.clear();
	});

	// The Reader family, Persistence and server-side Environment accessors now run locally in the
	// subprocess (Phase 1): they emit `bridges:*` messages with the 'APP_ID' sentinel instead of the
	// old host-resolved `accessor:*` messages. We spy on the sender to assert the emitted bridge call,
	// which is robust for the accessors that transform their result or return void.
	it('creates the correct format for IRead calls', async () => {
		const spy = mock.fn(senderFn);
		const roomRead = new AppAccessors(spy).getReader()!.getRoomReader();
		await roomRead.getById('123');

		assert.deepStrictEqual(spy.mock.calls[0].arguments, [
			{
				params: ['123', 'APP_ID'],
				method: 'bridges:getRoomBridge:doGetById',
			},
		]);
	});

	it('creates the correct format for IEnvironmentRead calls from IRead', async () => {
		const spy = mock.fn(senderFn);
		const reader = new AppAccessors(spy).getReader()!.getEnvironmentReader().getEnvironmentVariables();
		await reader.getValueByName('NODE_ENV');

		assert.deepStrictEqual(spy.mock.calls[0].arguments, [
			{
				params: ['NODE_ENV', 'APP_ID'],
				method: 'bridges:getEnvironmentalVariableBridge:doGetValueByName',
			},
		]);
	});

	it('creates the correct format for IEvironmentRead calls', async () => {
		const spy = mock.fn(senderFn);
		const envRead = new AppAccessors(spy).getEnvironmentRead();
		await envRead.getServerSettings().getOneById('123');

		assert.deepStrictEqual(spy.mock.calls[0].arguments, [
			{
				params: ['123', 'APP_ID'],
				method: 'bridges:getServerSettingBridge:doGetOneById',
			},
		]);
	});

	it('creates the correct format for IEvironmentWrite calls', async () => {
		const spy = mock.fn(senderFn);
		const envWrite = new AppAccessors(spy).getEnvironmentWrite();
		await envWrite.getServerSettings().incrementValue('123', 6);

		assert.deepStrictEqual(spy.mock.calls[0].arguments, [
			{
				params: ['123', 6, 'APP_ID'],
				method: 'bridges:getServerSettingBridge:doIncrementValue',
			},
		]);
	});

	it('creates the correct format for IConfigurationModify calls', async () => {
		const configModify = appAccessors.getConfigurationModify();
		const command = await configModify.slashCommands.modifySlashCommand({
			command: 'test',
			i18nDescription: 'test',
			i18nParamsExample: 'test',
			providesPreview: true,
			executor(_context: SlashCommandContext, _read: IRead, _modify: IModify, _http: IHttp, _persis: IPersistence): Promise<void> {
				throw new Error('Function not implemented.');
			},
		});

		// The function will not be serialized and sent to the main process
		delete (command as any).params[0].executor;

		assert.deepStrictEqual(command, {
			params: [
				{
					command: 'test',
					i18nDescription: 'test',
					i18nParamsExample: 'test',
					providesPreview: true,
				},
				'APP_ID',
			],
			method: 'bridges:getAppResourceBridge:doModifySlashCommand',
		});
	});

	it('correctly stores a reference to a slashcommand object and sends a request via proxy', async () => {
		const configExtend = appAccessors.getConfigurationExtend();

		const slashcommand = {
			command: 'test',
			i18nDescription: 'test',
			i18nParamsExample: 'test',
			providesPreview: true,
			executor() {
				return Promise.resolve();
			},
		};

		const result = await configExtend.slashCommands.provideSlashCommand(slashcommand);

		assert.deepStrictEqual(AppObjectRegistry.get('slashcommand:test'), slashcommand);

		// The function will not be serialized and sent to the main process
		delete (result as any).params[0].executor;

		assert.deepStrictEqual(result, {
			method: 'bridges:getAppResourceBridge:doProvideSlashCommand',
			params: [
				{
					command: 'test',
					i18nDescription: 'test',
					i18nParamsExample: 'test',
					providesPreview: true,
				},
				'APP_ID',
			],
		});
	});
});

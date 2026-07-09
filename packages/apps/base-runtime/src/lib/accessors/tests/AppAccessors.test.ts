/* eslint-disable @typescript-eslint/no-non-null-assertion -- acceptable in this test file */
/* eslint-disable testing-library/no-await-sync-queries */
import * as assert from 'node:assert';
import { after, beforeEach, describe, it } from 'node:test';

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

	it('creates the correct format for IRead calls', async () => {
		const roomRead = appAccessors.getReader()!.getRoomReader();
		const room = await roomRead.getById('123');

		assert.deepStrictEqual(room, {
			params: ['123'],
			method: 'accessor:getReader:getRoomReader:getById',
		});
	});

	it('creates the correct format for IEnvironmentRead calls from IRead', async () => {
		const reader = appAccessors.getReader()!.getEnvironmentReader().getEnvironmentVariables();
		const room = await reader.getValueByName('NODE_ENV');

		assert.deepStrictEqual(room, {
			params: ['NODE_ENV'],
			method: 'accessor:getReader:getEnvironmentReader:getEnvironmentVariables:getValueByName',
		});
	});

	it('creates the correct format for IEvironmentRead calls', async () => {
		const envRead = appAccessors.getEnvironmentRead();
		const env = await envRead.getServerSettings().getValueById('123');

		assert.deepStrictEqual(env, {
			params: ['123'],
			method: 'accessor:getEnvironmentRead:getServerSettings:getValueById',
		});
	});

	it('creates the correct format for IEvironmentWrite calls', async () => {
		const envRead = appAccessors.getEnvironmentWrite();
		const env = await envRead.getServerSettings().incrementValue('123', 6);

		assert.deepStrictEqual(env, {
			params: ['123', 6],
			method: 'accessor:getEnvironmentWrite:getServerSettings:incrementValue',
		});
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
			],
			method: 'accessor:getConfigurationModify:slashCommands:modifySlashCommand',
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
			method: 'accessor:getConfigurationExtend:slashCommands:provideSlashCommand',
			params: [
				{
					command: 'test',
					i18nDescription: 'test',
					i18nParamsExample: 'test',
					providesPreview: true,
				},
			],
		});
	});
});

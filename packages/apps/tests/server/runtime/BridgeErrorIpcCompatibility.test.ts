import * as assert from 'node:assert';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { describe, it, before, after } from 'node:test';
import * as v8 from 'node:v8';

import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import type { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import AdmZip from 'adm-zip';

import * as jsonrpc from '../../../src/lib/jsonrpc';
import type { AppManager } from '../../../src/server/AppManager';
import {
	CommandAlreadyExistsError,
	CommandHasAlreadyBeenTouchedError,
	PathAlreadyExistsError,
	RequiredApiVersionError,
	VideoConfProviderAlreadyExistsError,
	VideoConfProviderNotRegisteredError,
} from '../../../src/server/errors';
import { AppOutboundProcessError } from '../../../src/server/errors/AppOutboundProcessError';
import type { AppSlashCommandManager } from '../../../src/server/managers';
import { NodeRuntimeSubprocessController } from '../../../src/server/runtime/node/AppsEngineNodeRuntime';
import type { IAppStorageItem } from '../../../src/server/storage';
import { TestInfastructureSetup } from '../../test-data/utilities';

const errors: Record<string, () => unknown> = {
	'command-already-exists': () => new CommandAlreadyExistsError('command-already-exists'),
	'command-touched': () => new CommandHasAlreadyBeenTouchedError('command-touched'),
	'path-exists': () => new PathAlreadyExistsError('path-exists'),
	'provider-exists': () => new VideoConfProviderAlreadyExistsError('provider-exists'),
	'provider-not-registered': () => new VideoConfProviderNotRegisteredError('provider-not-registered'),
	'outbound': () => new AppOutboundProcessError('outbound failed', 'outbound'),
	'api-version': () => new RequiredApiVersionError({ name: 'App', id: 'app-id', requiredApiVersion: '2.0.0' } as IAppInfo, '1.0.0'),
	'pre-fix-shape': () => ({ name: 'CommandAlreadyExists', message: 'plain object, as the classes were before the fix' }),
};

const appSource = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { App } = require("@rocket.chat/apps-engine/definition/App");
class BridgeErrorApp extends App {
	async initialize(configurationExtend) {
		const received = {};
		for (const command of ${JSON.stringify(Object.keys(errors))}) {
			try {
				await configurationExtend.slashCommands.provideSlashCommand({ command, i18nParamsExample: "", i18nDescription: "", providesPreview: false, executor() {} });
				received[command] = "resolved";
			} catch (e) {
				received[command] = { isError: e instanceof Error, message: e.message };
			}
		}
		throw new Error(JSON.stringify(received));
	}
}
exports.HelloWorldTestApp = BridgeErrorApp;
`;

describe('Bridge errors over the IPC channel (host → subprocess)', () => {
	let controller: NodeRuntimeSubprocessController;

	before(
		async () => {
			const manager: AppManager = new TestInfastructureSetup().getMockManager();
			manager.getCommandManager = () =>
				({
					addCommand: (_appId: string, { command }: { command: string }) => {
						throw errors[command]();
					},
				}) as unknown as AppSlashCommandManager;

			const zip = new AdmZip(await fs.readFile(path.join(__dirname, '../../test-data/apps/hello-world-test_0.0.1.zip')));
			zip.updateFile('HelloWorldTestApp.js', Buffer.from(appSource));
			const appPackage = await manager.getParser().unpackageApp(zip.toBuffer());

			controller = new NodeRuntimeSubprocessController(manager, appPackage, {
				id: appPackage.info.id,
				status: AppStatus.MANUALLY_ENABLED,
			} as IAppStorageItem);
			await controller.setupApp();
		},
		{ timeout: 60_000 },
	);

	after(() => controller?.stopApp(), { timeout: 30_000 });

	it('delivers every error message to the app as a rejected Error', { timeout: 15_000 }, async () => {
		const failure = await controller.sendRequest({ method: 'app:initialize' }).then(
			() => assert.fail('initialize should reject with what the app received'),
			(e: jsonrpc.SerializedJsonRpcError) => e,
		);
		const received = JSON.parse(failure.message);

		for (const [command, create] of Object.entries(errors)) {
			assert.deepStrictEqual(received[command], { isError: true, message: (create() as Error).message }, command);
		}
	});

	it('clones the error left in `data` the way the advanced IPC serialization does', () => {
		for (const [command, create] of Object.entries(errors)) {
			const error = create() as Error;
			const sent = jsonrpc.error('id', new jsonrpc.JsonRpcError(error.message, jsonrpc.SERVER_ERROR, error));
			const arrived = v8.deserialize(v8.serialize(sent)) as jsonrpc.ErrorObject;

			assert.ok(jsonrpc.isErrorObject(arrived), command);
			assert.strictEqual(arrived.error.message, error.message, command);
			assert.strictEqual(arrived.error.code, jsonrpc.SERVER_ERROR, command);
			assert.strictEqual(arrived.error.data.message, error.message, command);
		}
	});
});

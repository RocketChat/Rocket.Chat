import * as assert from 'node:assert';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';

import type { ISlashCommandPreviewItem } from '../../../../src/definition/slashcommands';
import { SlashCommandContext } from '../../../../src/definition/slashcommands';
import type { AppManager } from '../../../../src/server/AppManager';
import type { ProxiedApp } from '../../../../src/server/ProxiedApp';
import type { AppBridges } from '../../../../src/server/bridges';
import type {
	AppApiManager,
	AppExternalComponentManager,
	AppSchedulerManager,
	AppVideoConfProviderManager,
} from '../../../../src/server/managers';
import { AppAccessorManager, AppSlashCommandManager } from '../../../../src/server/managers';
import { AppSlashCommand } from '../../../../src/server/managers/AppSlashCommand';
import type { UIActionButtonManager } from '../../../../src/server/managers/UIActionButtonManager';
import { Room } from '../../../../src/server/rooms/Room';
import type { AppLogStorage, IAppStorageItem } from '../../../../src/server/storage';
import { TestsAppBridges } from '../../../test-data/bridges/appBridges';
import { TestsAppLogStorage } from '../../../test-data/storage/logStorage';
import { TestData } from '../../../test-data/utilities';

describe('AppSlashCommandManager', () => {
	let mockBridges: TestsAppBridges;
	let mockApp: ProxiedApp;
	let mockAccessors: AppAccessorManager;
	let mockManager: AppManager;

	function setupMocks() {
		mockBridges = new TestsAppBridges();
		const bri = mockBridges;
		mockManager.getBridges = function _refreshedGetBridges(): AppBridges {
			return bri;
		};

		mock.method(mockBridges.getCommandBridge(), 'doDoesCommandExist');
		mock.method(mockBridges.getCommandBridge(), 'doRegisterCommand');
		mock.method(mockBridges.getCommandBridge(), 'doUnregisterCommand');
		mock.method(mockBridges.getCommandBridge(), 'doEnableCommand');
		mock.method(mockBridges.getCommandBridge(), 'doDisableCommand');
	}

	beforeEach(() => {
		mockBridges = new TestsAppBridges();

		mockApp = TestData.getMockApp({ info: { id: 'testing', name: 'TestApp' } } as IAppStorageItem, {} as AppManager);

		const bri = mockBridges;
		const app = mockApp;
		mockManager = {
			getBridges(): AppBridges {
				return bri;
			},
			getCommandManager() {
				return {} as AppSlashCommandManager;
			},
			getExternalComponentManager(): AppExternalComponentManager {
				return {} as AppExternalComponentManager;
			},
			getApiManager() {
				return {} as AppApiManager;
			},
			getOneById(appId: string): ProxiedApp {
				return appId === 'failMePlease' ? undefined : app;
			},
			getLogStorage(): AppLogStorage {
				return new TestsAppLogStorage();
			},
			getSchedulerManager() {
				return {} as AppSchedulerManager;
			},
			getUIActionButtonManager() {
				return {} as UIActionButtonManager;
			},
			getVideoConfProviderManager() {
				return {} as AppVideoConfProviderManager;
			},
		} as AppManager;

		mockAccessors = new AppAccessorManager(mockManager);
		const ac = mockAccessors;
		mockManager.getAccessorManager = function _getAccessorManager(): AppAccessorManager {
			return ac;
		};
	});

	afterEach(() => {
		mock.restoreAll();
	});

	it('basicAppSlashCommandManager', () => {
		setupMocks();
		assert.throws(() => new AppSlashCommandManager({} as AppManager));
		assert.doesNotThrow(() => new AppSlashCommandManager(mockManager));

		const ascm = new AppSlashCommandManager(mockManager);
		assert.strictEqual((ascm as any).manager, mockManager);
		assert.strictEqual((ascm as any).bridge, mockBridges.getCommandBridge());
		assert.strictEqual((ascm as any).accessors, mockManager.getAccessorManager());
		assert.ok((ascm as any).providedCommands !== undefined);
		assert.strictEqual((ascm as any).providedCommands.size, 0);
		assert.ok((ascm as any).modifiedCommands !== undefined);
		assert.strictEqual((ascm as any).modifiedCommands.size, 0);
		assert.ok((ascm as any).touchedCommandsToApps !== undefined);
		assert.strictEqual((ascm as any).touchedCommandsToApps.size, 0);
		assert.ok((ascm as any).appsTouchedCommands !== undefined);
		assert.strictEqual((ascm as any).appsTouchedCommands.size, 0);
	});

	it('canCommandBeTouchedBy', () => {
		setupMocks();
		const ascm = new AppSlashCommandManager(mockManager);

		assert.strictEqual(ascm.canCommandBeTouchedBy('testing', 'command'), true);
		(ascm as any).touchedCommandsToApps.set('just-a-test', 'anotherAppId');
		assert.strictEqual(ascm.canCommandBeTouchedBy('testing', 'just-a-test'), false);
	});

	it('isAlreadyDefined', () => {
		setupMocks();
		const ascm = new AppSlashCommandManager(mockManager);

		const reg = new Map<string, AppSlashCommand>();
		reg.set('command', new AppSlashCommand(mockApp, TestData.getSlashCommand('command')));

		assert.strictEqual(ascm.isAlreadyDefined('command'), false);
		(ascm as any).providedCommands.set('testing', reg);
		assert.strictEqual(ascm.isAlreadyDefined('command'), true);
		assert.strictEqual(ascm.isAlreadyDefined('cOMMand'), true);
		assert.strictEqual(ascm.isAlreadyDefined(' command '), true);
		assert.strictEqual(ascm.isAlreadyDefined('c0mmand'), false);
	});

	it('setAsTouched', () => {
		setupMocks();
		const ascm = new AppSlashCommandManager(mockManager);

		assert.doesNotThrow(() => (ascm as any).setAsTouched('testing', 'command'));
		assert.strictEqual((ascm as any).appsTouchedCommands.has('testing'), true);
		assert.ok((ascm as any).appsTouchedCommands.get('testing').length > 0);
		assert.strictEqual((ascm as any).appsTouchedCommands.get('testing').length, 1);
		assert.strictEqual((ascm as any).touchedCommandsToApps.has('command'), true);
		assert.strictEqual((ascm as any).touchedCommandsToApps.get('command'), 'testing');
		assert.doesNotThrow(() => (ascm as any).setAsTouched('testing', 'command'));
		assert.strictEqual((ascm as any).appsTouchedCommands.get('testing').length, 1);
	});

	it('registerCommand', async () => {
		setupMocks();
		const ascm = new AppSlashCommandManager(mockManager);
		const doRegisterCommandSpy = (mockBridges.getCommandBridge() as any).doRegisterCommand;

		const regInfo = new AppSlashCommand(mockApp, TestData.getSlashCommand('command'));

		await assert.doesNotReject(() => (ascm as any).registerCommand('testing', regInfo));
		assert.strictEqual(doRegisterCommandSpy.mock.calls.length, 1);
		assert.deepStrictEqual(doRegisterCommandSpy.mock.calls[0].arguments, [regInfo.slashCommand, 'testing']);
		assert.strictEqual(regInfo.isRegistered, true);
		assert.strictEqual(regInfo.isDisabled, false);
		assert.strictEqual(regInfo.isEnabled, true);
	});

	it('addCommand', async () => {
		setupMocks();
		const cmd = TestData.getSlashCommand('my-cmd');
		const ascm = new AppSlashCommandManager(mockManager);

		await assert.doesNotReject(async () => ascm.addCommand('testing', cmd));
		assert.strictEqual(mockBridges.getCommandBridge().commands.size, 1);
		assert.strictEqual((ascm as any).providedCommands.size, 1);
		assert.strictEqual((ascm as any).touchedCommandsToApps.get('my-cmd'), 'testing');
		assert.strictEqual((ascm as any).appsTouchedCommands.get('testing').length, 1);
		await assert.rejects(() => ascm.addCommand('another-app', cmd), {
			name: 'CommandHasAlreadyBeenTouched',
			message: 'The command "my-cmd" has already been touched by another App.',
		});
		await assert.rejects(() => ascm.addCommand('testing', cmd), {
			name: 'CommandAlreadyExists',
			message: 'The command "my-cmd" already exists in the system.',
		});
		await assert.rejects(() => ascm.addCommand('failMePlease', TestData.getSlashCommand('yet-another')), {
			name: 'Error',
			message: 'App must exist in order for a command to be added.',
		});
		await assert.doesNotReject(async () => ascm.addCommand('testing', TestData.getSlashCommand('another-command')));
		assert.strictEqual((ascm as any).providedCommands.size, 1);
		assert.strictEqual((ascm as any).providedCommands.get('testing').size, 2);
		await assert.rejects(() => ascm.addCommand('even-another-app', TestData.getSlashCommand('it-exists')), {
			name: 'CommandAlreadyExists',
			message: 'The command "it-exists" already exists in the system.',
		});
	});

	it('failToModifyAnotherAppsCommand', async () => {
		setupMocks();
		const ascm = new AppSlashCommandManager(mockManager);
		await ascm.addCommand('other-app', TestData.getSlashCommand('my-cmd'));

		await assert.rejects(() => ascm.modifyCommand('testing', TestData.getSlashCommand('my-cmd')), {
			name: 'CommandHasAlreadyBeenTouched',
			message: 'The command "my-cmd" has already been touched by another App.',
		});
	});

	it('failToModifyNonExistantAppCommand', async () => {
		setupMocks();
		const ascm = new AppSlashCommandManager(mockManager);

		await assert.rejects(() => ascm.modifyCommand('failMePlease', TestData.getSlashCommand('yet-another')), {
			name: 'Error',
			message: 'App must exist in order to modify a command.',
		});
	});

	it('modifyMyCommand', async () => {
		setupMocks();
		const ascm = new AppSlashCommandManager(mockManager);

		await assert.rejects(() => ascm.modifyCommand('testing', TestData.getSlashCommand()), {
			name: 'Error',
			message: 'You must first register a command before you can modify it.',
		});
		await ascm.addCommand('testing', TestData.getSlashCommand('the-cmd'));
		await assert.doesNotReject(() => ascm.modifyCommand('testing', TestData.getSlashCommand('the-cmd')));
	});

	it('modifySystemCommand', async () => {
		setupMocks();
		const ascm = new AppSlashCommandManager(mockManager);

		await assert.doesNotReject(() => ascm.modifyCommand('brand-new-id', TestData.getSlashCommand('it-exists')));
		assert.strictEqual((ascm as any).modifiedCommands.size, 1);
		assert.ok((ascm as any).modifiedCommands.get('it-exists') !== undefined);
		assert.strictEqual((ascm as any).touchedCommandsToApps.get('it-exists'), 'brand-new-id');
	});

	it('enableMyCommand', async () => {
		setupMocks();
		const ascm = new AppSlashCommandManager(mockManager);
		const doDoesCommandExistSpy = (mockBridges.getCommandBridge() as any).doDoesCommandExist;

		await assert.rejects(() => ascm.enableCommand('testing', 'doesnt-exist'), {
			name: 'Error',
			message: 'The command "doesnt-exist" does not exist to enable.',
		});
		await ascm.addCommand('testing', TestData.getSlashCommand('command'));
		await assert.doesNotReject(() => ascm.enableCommand('testing', 'command'));
		assert.strictEqual((ascm as any).providedCommands.get('testing').get('command').isDisabled, false);
		assert.strictEqual((ascm as any).providedCommands.get('testing').get('command').isEnabled, true);
		await ascm.addCommand('testing', TestData.getSlashCommand('another-command'));
		(ascm as any).providedCommands.get('testing').get('another-command').isRegistered = true;
		await assert.doesNotReject(() => ascm.enableCommand('testing', 'another-command'));
		assert.strictEqual(doDoesCommandExistSpy.mock.calls.length, 3);
	});

	it('enableSystemCommand', async () => {
		setupMocks();
		const ascm = new AppSlashCommandManager(mockManager);
		const doEnableCommandSpy = (mockBridges.getCommandBridge() as any).doEnableCommand;
		const doDoesCommandExistSpy = (mockBridges.getCommandBridge() as any).doDoesCommandExist;

		await assert.doesNotReject(() => ascm.enableCommand('testing', 'it-exists'));
		assert.strictEqual(doEnableCommandSpy.mock.calls.length, 1);
		assert.deepStrictEqual(doEnableCommandSpy.mock.calls[0].arguments, ['it-exists', 'testing']);
		assert.strictEqual(doDoesCommandExistSpy.mock.calls.length, 1);
	});

	it('failToEnableAnotherAppsCommand', async () => {
		setupMocks();
		const ascm = new AppSlashCommandManager(mockManager);
		await ascm.addCommand('another-app', TestData.getSlashCommand('command'));

		await assert.rejects(() => ascm.enableCommand('my-app', 'command'), {
			name: 'CommandHasAlreadyBeenTouched',
			message: 'The command "command" has already been touched by another App.',
		});
	});

	it('disableMyCommand', async () => {
		setupMocks();
		const ascm = new AppSlashCommandManager(mockManager);
		const doDoesCommandExistSpy = (mockBridges.getCommandBridge() as any).doDoesCommandExist;

		await assert.rejects(() => ascm.disableCommand('testing', 'doesnt-exist'), {
			name: 'Error',
			message: 'The command "doesnt-exist" does not exist to disable.',
		});
		await ascm.addCommand('testing', TestData.getSlashCommand('command'));
		await assert.doesNotReject(() => ascm.disableCommand('testing', 'command'));
		assert.strictEqual((ascm as any).providedCommands.get('testing').get('command').isDisabled, true);
		assert.strictEqual((ascm as any).providedCommands.get('testing').get('command').isEnabled, false);
		await ascm.addCommand('testing', TestData.getSlashCommand('another-command'));
		(ascm as any).providedCommands.get('testing').get('another-command').isRegistered = true;
		await assert.doesNotReject(() => ascm.disableCommand('testing', 'another-command'));
		assert.strictEqual(doDoesCommandExistSpy.mock.calls.length, 3);
	});

	it('disableSystemCommand', async () => {
		setupMocks();
		const ascm = new AppSlashCommandManager(mockManager);
		const doDisableCommandSpy = (mockBridges.getCommandBridge() as any).doDisableCommand;
		const doDoesCommandExistSpy = (mockBridges.getCommandBridge() as any).doDoesCommandExist;

		await assert.doesNotReject(() => ascm.disableCommand('testing', 'it-exists'));
		assert.strictEqual(doDisableCommandSpy.mock.calls.length, 1);
		assert.deepStrictEqual(doDisableCommandSpy.mock.calls[0].arguments, ['it-exists', 'testing']);
		assert.strictEqual(doDoesCommandExistSpy.mock.calls.length, 1);
	});

	it('failToDisableAnotherAppsCommand', async () => {
		setupMocks();
		const ascm = new AppSlashCommandManager(mockManager);
		await ascm.addCommand('another-app', TestData.getSlashCommand('command'));

		await assert.rejects(() => ascm.disableCommand('my-app', 'command'), {
			name: 'CommandHasAlreadyBeenTouched',
			message: 'The command "command" has already been touched by another App.',
		});
	});

	it('registerCommands', async () => {
		setupMocks();
		const ascm = new AppSlashCommandManager(mockManager);
		const doRegisterCommandSpy = (mockBridges.getCommandBridge() as any).doRegisterCommand;

		const registerCommandSpy = mock.method(ascm as any, 'registerCommand');

		await ascm.addCommand('testing', TestData.getSlashCommand('enabled-command'));
		const enabledRegInfo = (ascm as any).providedCommands.get('testing').get('enabled-command') as AppSlashCommand;
		await ascm.addCommand('testing', TestData.getSlashCommand('disabled-command'));
		await ascm.disableCommand('testing', 'disabled-command');
		const disabledRegInfo = (ascm as any).providedCommands.get('testing').get('disabled-command') as AppSlashCommand;

		await assert.doesNotReject(() => ascm.registerCommands('non-existant'));
		await assert.doesNotReject(() => ascm.registerCommands('testing'));
		assert.strictEqual(enabledRegInfo.isRegistered, true);
		assert.strictEqual(disabledRegInfo.isRegistered, false);
		assert.strictEqual(
			registerCommandSpy.mock.calls.filter((c: any) => c.arguments[0] === 'testing' && c.arguments[1] === enabledRegInfo).length,
			1,
		);
		assert.strictEqual(
			doRegisterCommandSpy.mock.calls.filter((c: any) => c.arguments[0] === enabledRegInfo.slashCommand && c.arguments[1] === 'testing').length,
			1,
		);
	});

	it('unregisterCommands', async () => {
		setupMocks();
		const ascm = new AppSlashCommandManager(mockManager);
		const doUnregisterCommandSpy = (mockBridges.getCommandBridge() as any).doUnregisterCommand;

		await ascm.addCommand('testing', TestData.getSlashCommand('command'));
		await ascm.modifyCommand('testing', TestData.getSlashCommand('it-exists'));

		await assert.doesNotReject(() => ascm.unregisterCommands('non-existant'));
		await assert.doesNotReject(() => ascm.unregisterCommands('testing'));
		assert.strictEqual(doUnregisterCommandSpy.mock.calls.length, 1);
	});

	it('executeCommands', async () => {
		setupMocks();
		const ascm = new AppSlashCommandManager(mockManager);
		await ascm.addCommand('testing', TestData.getSlashCommand('command'));
		await ascm.addCommand('testing', TestData.getSlashCommand('not-registered'));
		await ascm.addCommand('testing', TestData.getSlashCommand('disabled-command'));
		await ascm.disableCommand('testing', 'not-registered');
		await ascm.registerCommands('testing');
		(ascm as any).providedCommands.get('testing').get('disabled-command').isDisabled = true;
		await ascm.modifyCommand('testing', TestData.getSlashCommand('it-exists'));

		const context = new SlashCommandContext(TestData.getUser(), TestData.getRoom(), []);

		await assert.doesNotReject(() => ascm.executeCommand('nope', context));
		await assert.doesNotReject(() => ascm.executeCommand('it-exists', context));
		await assert.doesNotReject(() => ascm.executeCommand('command', context));
		await assert.doesNotReject(() => ascm.executeCommand('not-registered', context));
		await assert.doesNotReject(() => ascm.executeCommand('disabled-command', context));

		const classContext = new SlashCommandContext(TestData.getUser(), new Room(TestData.getRoom(), mockManager), []);
		await assert.doesNotReject(() => ascm.executeCommand('it-exists', classContext));

		// set it up for no "no app failure"
		const failedItems = new Map<string, AppSlashCommand>();
		const asm = new AppSlashCommand(mockApp, TestData.getSlashCommand('failure'));
		asm.hasBeenRegistered();
		failedItems.set('failure', asm);
		(ascm as any).providedCommands.set('failMePlease', failedItems);
		(ascm as any).touchedCommandsToApps.set('failure', 'failMePlease');
		await assert.rejects(() => ascm.executeCommand('failure', context));
	});

	it('getPreviews', async () => {
		setupMocks();
		const ascm = new AppSlashCommandManager(mockManager);
		await ascm.addCommand('testing', TestData.getSlashCommand('command'));
		await ascm.addCommand('testing', TestData.getSlashCommand('not-registered'));
		await ascm.addCommand('testing', TestData.getSlashCommand('disabled-command'));
		await ascm.disableCommand('testing', 'not-registered');
		await ascm.registerCommands('testing');
		(ascm as any).providedCommands.get('testing').get('disabled-command').isDisabled = true;
		await ascm.modifyCommand('testing', TestData.getSlashCommand('it-exists'));

		const context = new SlashCommandContext(TestData.getUser(), TestData.getRoom(), ['testing']);

		await assert.doesNotReject(() => ascm.getPreviews('nope', context));
		await assert.doesNotReject(() => ascm.getPreviews('it-exists', context));
		await assert.doesNotReject(() => ascm.getPreviews('command', context));
		await assert.doesNotReject(() => ascm.getPreviews('not-registered', context));
		await assert.doesNotReject(() => ascm.getPreviews('disabled-command', context));

		const classContext = new SlashCommandContext(TestData.getUser(), new Room(TestData.getRoom(), mockManager), []);
		await assert.doesNotReject(() => ascm.getPreviews('it-exists', classContext));

		// set it up for no "no app failure"
		const failedItems = new Map<string, AppSlashCommand>();
		const asm = new AppSlashCommand(mockApp, TestData.getSlashCommand('failure'));
		asm.hasBeenRegistered();
		failedItems.set('failure', asm);
		(ascm as any).providedCommands.set('failMePlease', failedItems);
		(ascm as any).touchedCommandsToApps.set('failure', 'failMePlease');
		await assert.doesNotReject(() => ascm.getPreviews('failure', context));
	});

	it('executePreview', async () => {
		setupMocks();
		const previewItem = {} as ISlashCommandPreviewItem;
		const ascm = new AppSlashCommandManager(mockManager);
		await ascm.addCommand('testing', TestData.getSlashCommand('command'));
		await ascm.addCommand('testing', TestData.getSlashCommand('not-registered'));
		await ascm.addCommand('testing', TestData.getSlashCommand('disabled-command'));
		await ascm.disableCommand('testing', 'not-registered');
		await ascm.registerCommands('testing');
		(ascm as any).providedCommands.get('testing').get('disabled-command').isDisabled = true;
		await ascm.modifyCommand('testing', TestData.getSlashCommand('it-exists'));

		const context = new SlashCommandContext(TestData.getUser(), TestData.getRoom(), ['testing']);

		await assert.doesNotReject(() => ascm.executePreview('nope', previewItem, context));
		await assert.doesNotReject(() => ascm.executePreview('it-exists', previewItem, context));
		await assert.doesNotReject(() => ascm.executePreview('command', previewItem, context));
		await assert.doesNotReject(() => ascm.executePreview('not-registered', previewItem, context));
		await assert.doesNotReject(() => ascm.executePreview('disabled-command', previewItem, context));

		const classContext = new SlashCommandContext(TestData.getUser(), new Room(TestData.getRoom(), mockManager), []);
		await assert.doesNotReject(() => ascm.executePreview('it-exists', previewItem, classContext));

		// set it up for no "no app failure"
		const failedItems = new Map<string, AppSlashCommand>();
		const asm = new AppSlashCommand(mockApp, TestData.getSlashCommand('failure'));
		asm.hasBeenRegistered();
		failedItems.set('failure', asm);
		(ascm as any).providedCommands.set('failMePlease', failedItems);
		(ascm as any).touchedCommandsToApps.set('failure', 'failMePlease');
		await ascm.executePreview('nope', previewItem, context).catch(() => {});

		await assert.doesNotReject(() => ascm.executePreview('failure', previewItem, context));
	});
});

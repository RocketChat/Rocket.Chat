import type { FunctionSpy, RestorableFunctionSpy } from 'alsatian';
import { AsyncTest, Expect, Setup, SetupFixture, SpyOn, Teardown, Test } from 'alsatian';

import { AppStatus } from '../../../src/definition/AppStatus';
import type { AppMethod } from '../../../src/definition/metadata';
import type { ISlashCommandPreviewItem } from '../../../src/definition/slashcommands';
import { SlashCommandContext } from '../../../src/definition/slashcommands';
import type { AppManager } from '../../../src/server/AppManager';
import type { ProxiedApp } from '../../../src/server/ProxiedApp';
import type { AppBridges } from '../../../src/server/bridges';
import { CommandAlreadyExistsError, CommandHasAlreadyBeenTouchedError } from '../../../src/server/errors';
import { AppConsole } from '../../../src/server/logging';
import type { AppApiManager, AppExternalComponentManager, AppSchedulerManager, AppVideoConfProviderManager } from '../../../src/server/managers';
import { AppAccessorManager, AppSlashCommandManager } from '../../../src/server/managers';
import { AppSlashCommand } from '../../../src/server/managers/AppSlashCommand';
import type { UIActionButtonManager } from '../../../src/server/managers/UIActionButtonManager';
import { Room } from '../../../src/server/rooms/Room';
import type { AppsEngineRuntime } from '../../../src/server/runtime/AppsEngineRuntime';
import type { DenoRuntimeSubprocessController } from '../../../src/server/runtime/deno/AppsEngineDenoRuntime';
import type { AppLogStorage } from '../../../src/server/storage';
import { TestsAppBridges } from '../../test-data/bridges/appBridges';
import { TestsAppLogStorage } from '../../test-data/storage/logStorage';
import { TestData } from '../../test-data/utilities';

export class AppSlashCommandManagerTestFixture {
    public static doThrow = false;

    private mockBridges: TestsAppBridges;

    private mockApp: ProxiedApp;

    private mockAccessors: AppAccessorManager;

    private mockManager: AppManager;

    private spies: Array<RestorableFunctionSpy>;

    @SetupFixture
    public setupFixture() {
        this.mockBridges = new TestsAppBridges();

        this.mockApp = {
            getRuntime() {
                return {} as AppsEngineRuntime;
            },
            getDenoRuntime() {
                return {
                    sendRequest: () => {},
                } as unknown as DenoRuntimeSubprocessController;
            },
            getID() {
                return 'testing';
            },
            getStatus() {
                return Promise.resolve(AppStatus.AUTO_ENABLED);
            },
            setupLogger(method: AppMethod): AppConsole {
                return new AppConsole(method);
            },
        } as ProxiedApp;

        const bri = this.mockBridges;
        const app = this.mockApp;
        this.mockManager = {
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

        this.mockAccessors = new AppAccessorManager(this.mockManager);
        const ac = this.mockAccessors;
        this.mockManager.getAccessorManager = function _getAccessorManager(): AppAccessorManager {
            return ac;
        };
    }

    @Setup
    public setup() {
        this.mockBridges = new TestsAppBridges();
        const bri = this.mockBridges;
        this.mockManager.getBridges = function _refreshedGetBridges(): AppBridges {
            return bri;
        };

        this.spies = [];
        this.spies.push(SpyOn(this.mockBridges.getCommandBridge(), 'doDoesCommandExist'));
        this.spies.push(SpyOn(this.mockBridges.getCommandBridge(), 'doRegisterCommand'));
        this.spies.push(SpyOn(this.mockBridges.getCommandBridge(), 'doUnregisterCommand'));
        this.spies.push(SpyOn(this.mockBridges.getCommandBridge(), 'doEnableCommand'));
        this.spies.push(SpyOn(this.mockBridges.getCommandBridge(), 'doDisableCommand'));
    }

    @Teardown
    public teardown() {
        this.spies.forEach((s) => s.restore());
    }

    @Test()
    public basicAppSlashCommandManager() {
        Expect(() => new AppSlashCommandManager({} as AppManager)).toThrow();
        Expect(() => new AppSlashCommandManager(this.mockManager)).not.toThrow();

        const ascm = new AppSlashCommandManager(this.mockManager);
        Expect((ascm as any).manager).toBe(this.mockManager);
        Expect((ascm as any).bridge).toBe(this.mockBridges.getCommandBridge());
        Expect((ascm as any).accessors).toBe(this.mockManager.getAccessorManager());
        Expect((ascm as any).providedCommands).toBeDefined();
        Expect((ascm as any).providedCommands.size).toBe(0);
        Expect((ascm as any).modifiedCommands).toBeDefined();
        Expect((ascm as any).modifiedCommands.size).toBe(0);
        Expect((ascm as any).touchedCommandsToApps).toBeDefined();
        Expect((ascm as any).touchedCommandsToApps.size).toBe(0);
        Expect((ascm as any).appsTouchedCommands).toBeDefined();
        Expect((ascm as any).appsTouchedCommands.size).toBe(0);
    }

    @Test()
    public canCommandBeTouchedBy() {
        const ascm = new AppSlashCommandManager(this.mockManager);

        Expect(ascm.canCommandBeTouchedBy('testing', 'command')).toBe(true);
        (ascm as any).touchedCommandsToApps.set('just-a-test', 'anotherAppId');
        Expect(ascm.canCommandBeTouchedBy('testing', 'just-a-test')).toBe(false);
    }

    @Test()
    public isAlreadyDefined() {
        const ascm = new AppSlashCommandManager(this.mockManager);

        const reg = new Map<string, AppSlashCommand>();
        reg.set('command', new AppSlashCommand(this.mockApp, TestData.getSlashCommand('command')));

        Expect(ascm.isAlreadyDefined('command')).toBe(false);
        (ascm as any).providedCommands.set('testing', reg);
        Expect(ascm.isAlreadyDefined('command')).toBe(true);
        Expect(ascm.isAlreadyDefined('cOMMand')).toBe(true);
        Expect(ascm.isAlreadyDefined(' command ')).toBe(true);
        Expect(ascm.isAlreadyDefined('c0mmand')).toBe(false);
    }

    @Test()
    public setAsTouched() {
        const ascm = new AppSlashCommandManager(this.mockManager);

        Expect(() => (ascm as any).setAsTouched('testing', 'command')).not.toThrow();
        Expect((ascm as any).appsTouchedCommands.has('testing')).toBe(true);
        Expect((ascm as any).appsTouchedCommands.get('testing') as Array<string>).not.toBeEmpty();
        Expect((ascm as any).appsTouchedCommands.get('testing').length).toBe(1);
        Expect((ascm as any).touchedCommandsToApps.has('command')).toBe(true);
        Expect((ascm as any).touchedCommandsToApps.get('command')).toBe('testing');
        Expect(() => (ascm as any).setAsTouched('testing', 'command')).not.toThrow();
        Expect((ascm as any).appsTouchedCommands.get('testing').length).toBe(1);
    }

    @AsyncTest()
    public async registerCommand() {
        const ascm = new AppSlashCommandManager(this.mockManager);

        const regInfo = new AppSlashCommand(this.mockApp, TestData.getSlashCommand('command'));

        await Expect(() => (ascm as any).registerCommand('testing', regInfo)).not.toThrowAsync();
        Expect(this.mockBridges.getCommandBridge().doRegisterCommand).toHaveBeenCalledWith(regInfo.slashCommand, 'testing');
        Expect(regInfo.isRegistered).toBe(true);
        Expect(regInfo.isDisabled).toBe(false);
        Expect(regInfo.isEnabled).toBe(true);
    }

    @AsyncTest()
    public async addCommand() {
        const cmd = TestData.getSlashCommand('my-cmd');
        const ascm = new AppSlashCommandManager(this.mockManager);

        await Expect(async () => ascm.addCommand('testing', cmd)).not.toThrowAsync();
        Expect(this.mockBridges.getCommandBridge().commands.size).toBe(1);
        Expect((ascm as any).providedCommands.size).toBe(1);
        Expect((ascm as any).touchedCommandsToApps.get('my-cmd')).toBe('testing');
        Expect((ascm as any).appsTouchedCommands.get('testing').length).toBe(1);
        await Expect(() => ascm.addCommand('another-app', cmd)).toThrowErrorAsync(
            CommandHasAlreadyBeenTouchedError,
            'The command "my-cmd" has already been touched by another App.',
        );
        await Expect(() => ascm.addCommand('testing', cmd)).toThrowErrorAsync(CommandAlreadyExistsError, 'The command "my-cmd" already exists in the system.');
        await Expect(() => ascm.addCommand('failMePlease', TestData.getSlashCommand('yet-another'))).toThrowErrorAsync(
            Error,
            'App must exist in order for a command to be added.',
        );
        await Expect(() => ascm.addCommand('testing', TestData.getSlashCommand('another-command'))).not.toThrowAsync();
        Expect((ascm as any).providedCommands.size).toBe(1);
        Expect((ascm as any).providedCommands.get('testing').size).toBe(2);
        await Expect(() => ascm.addCommand('even-another-app', TestData.getSlashCommand('it-exists'))).toThrowErrorAsync(
            CommandAlreadyExistsError,
            'The command "it-exists" already exists in the system.',
        );
    }

    @AsyncTest()
    public async failToModifyAnotherAppsCommand() {
        const ascm = new AppSlashCommandManager(this.mockManager);
        await ascm.addCommand('other-app', TestData.getSlashCommand('my-cmd'));

        await Expect(() => ascm.modifyCommand('testing', TestData.getSlashCommand('my-cmd'))).toThrowErrorAsync(
            CommandHasAlreadyBeenTouchedError,
            'The command "my-cmd" has already been touched by another App.',
        );
    }

    @AsyncTest()
    public async failToModifyNonExistantAppCommand() {
        const ascm = new AppSlashCommandManager(this.mockManager);

        await Expect(() => ascm.modifyCommand('failMePlease', TestData.getSlashCommand('yet-another'))).toThrowErrorAsync(
            Error,
            'App must exist in order to modify a command.',
        );
    }

    @AsyncTest()
    public async modifyMyCommand() {
        const ascm = new AppSlashCommandManager(this.mockManager);

        await Expect(() => ascm.modifyCommand('testing', TestData.getSlashCommand())).toThrowErrorAsync(
            Error,
            'You must first register a command before you can modify it.',
        );
        await ascm.addCommand('testing', TestData.getSlashCommand('the-cmd'));
        await Expect(() => ascm.modifyCommand('testing', TestData.getSlashCommand('the-cmd'))).not.toThrowAsync();
    }

    @AsyncTest()
    public async modifySystemCommand() {
        const ascm = new AppSlashCommandManager(this.mockManager);

        await Expect(() => ascm.modifyCommand('brand-new-id', TestData.getSlashCommand('it-exists'))).not.toThrowAsync();
        Expect((ascm as any).modifiedCommands.size).toBe(1);
        Expect((ascm as any).modifiedCommands.get('it-exists')).toBeDefined();
        Expect((ascm as any).touchedCommandsToApps.get('it-exists')).toBe('brand-new-id');
    }

    @AsyncTest()
    public async enableMyCommand() {
        const ascm = new AppSlashCommandManager(this.mockManager);

        await Expect(() => ascm.enableCommand('testing', 'doesnt-exist')).toThrowErrorAsync(Error, 'The command "doesnt-exist" does not exist to enable.');
        await ascm.addCommand('testing', TestData.getSlashCommand('command'));
        await Expect(() => ascm.enableCommand('testing', 'command')).not.toThrowAsync();
        Expect((ascm as any).providedCommands.get('testing').get('command').isDisabled).toBe(false);
        Expect((ascm as any).providedCommands.get('testing').get('command').isEnabled).toBe(true);
        await ascm.addCommand('testing', TestData.getSlashCommand('another-command'));
        (ascm as any).providedCommands.get('testing').get('another-command').isRegistered = true;
        await Expect(() => ascm.enableCommand('testing', 'another-command')).not.toThrowAsync();
        Expect(this.mockBridges.getCommandBridge().doDoesCommandExist).toHaveBeenCalled().exactly(3);
    }

    @AsyncTest()
    public async enableSystemCommand() {
        const ascm = new AppSlashCommandManager(this.mockManager);

        await Expect(() => ascm.enableCommand('testing', 'it-exists')).not.toThrowAsync();
        Expect(this.mockBridges.getCommandBridge().doEnableCommand).toHaveBeenCalledWith('it-exists', 'testing').exactly(1);
        Expect(this.mockBridges.getCommandBridge().doDoesCommandExist).toHaveBeenCalled().exactly(1);
    }

    @AsyncTest()
    public async failToEnableAnotherAppsCommand() {
        const ascm = new AppSlashCommandManager(this.mockManager);
        await ascm.addCommand('another-app', TestData.getSlashCommand('command'));

        await Expect(() => ascm.enableCommand('my-app', 'command')).toThrowErrorAsync(
            CommandHasAlreadyBeenTouchedError,
            'The command "command" has already been touched by another App.',
        );
    }

    @AsyncTest()
    public async disableMyCommand() {
        const ascm = new AppSlashCommandManager(this.mockManager);

        await Expect(() => ascm.disableCommand('testing', 'doesnt-exist')).toThrowErrorAsync(Error, 'The command "doesnt-exist" does not exist to disable.');
        await ascm.addCommand('testing', TestData.getSlashCommand('command'));
        await Expect(() => ascm.disableCommand('testing', 'command')).not.toThrowAsync();
        Expect((ascm as any).providedCommands.get('testing').get('command').isDisabled).toBe(true);
        Expect((ascm as any).providedCommands.get('testing').get('command').isEnabled).toBe(false);
        await ascm.addCommand('testing', TestData.getSlashCommand('another-command'));
        (ascm as any).providedCommands.get('testing').get('another-command').isRegistered = true;
        await Expect(() => ascm.disableCommand('testing', 'another-command')).not.toThrowAsync();
        Expect(this.mockBridges.getCommandBridge().doDoesCommandExist).toHaveBeenCalled().exactly(3);
    }

    @AsyncTest()
    public async disableSystemCommand() {
        const ascm = new AppSlashCommandManager(this.mockManager);

        await Expect(() => ascm.disableCommand('testing', 'it-exists')).not.toThrowAsync();
        Expect(this.mockBridges.getCommandBridge().doDisableCommand).toHaveBeenCalledWith('it-exists', 'testing').exactly(1);
        Expect(this.mockBridges.getCommandBridge().doDoesCommandExist).toHaveBeenCalled().exactly(1);
    }

    @AsyncTest()
    public async failToDisableAnotherAppsCommand() {
        const ascm = new AppSlashCommandManager(this.mockManager);
        await ascm.addCommand('another-app', TestData.getSlashCommand('command'));

        await Expect(() => ascm.disableCommand('my-app', 'command')).toThrowErrorAsync(
            CommandHasAlreadyBeenTouchedError,
            'The command "command" has already been touched by another App.',
        );
    }

    @AsyncTest()
    public async registerCommands() {
        const ascm = new AppSlashCommandManager(this.mockManager);

        SpyOn(ascm, 'registerCommand');

        await ascm.addCommand('testing', TestData.getSlashCommand('enabled-command'));
        const enabledRegInfo = (ascm as any).providedCommands.get('testing').get('enabled-command') as AppSlashCommand;
        await ascm.addCommand('testing', TestData.getSlashCommand('disabled-command'));
        await ascm.disableCommand('testing', 'disabled-command');
        const disabledRegInfo = (ascm as any).providedCommands.get('testing').get('disabled-command') as AppSlashCommand;

        await Expect(() => ascm.registerCommands('non-existant')).not.toThrowAsync();
        await Expect(() => ascm.registerCommands('testing')).not.toThrowAsync();
        Expect(enabledRegInfo.isRegistered).toBe(true);
        Expect(disabledRegInfo.isRegistered).toBe(false);
        Expect((ascm as any).registerCommand as FunctionSpy)
            .toHaveBeenCalledWith('testing', enabledRegInfo)
            .exactly(1);
        Expect(this.mockBridges.getCommandBridge().doRegisterCommand).toHaveBeenCalledWith(enabledRegInfo.slashCommand, 'testing').exactly(1);
    }

    @AsyncTest()
    public async unregisterCommands() {
        const ascm = new AppSlashCommandManager(this.mockManager);

        await ascm.addCommand('testing', TestData.getSlashCommand('command'));
        await ascm.modifyCommand('testing', TestData.getSlashCommand('it-exists'));

        await Expect(() => ascm.unregisterCommands('non-existant')).not.toThrowAsync();
        await Expect(() => ascm.unregisterCommands('testing')).not.toThrowAsync();
        Expect(this.mockBridges.getCommandBridge().doUnregisterCommand).toHaveBeenCalled().exactly(1);
    }

    @AsyncTest()
    public async executeCommands() {
        const ascm = new AppSlashCommandManager(this.mockManager);
        await ascm.addCommand('testing', TestData.getSlashCommand('command'));
        await ascm.addCommand('testing', TestData.getSlashCommand('not-registered'));
        await ascm.addCommand('testing', TestData.getSlashCommand('disabled-command'));
        await ascm.disableCommand('testing', 'not-registered');
        await ascm.registerCommands('testing');
        (ascm as any).providedCommands.get('testing').get('disabled-command').isDisabled = true;
        await ascm.modifyCommand('testing', TestData.getSlashCommand('it-exists'));

        const context = new SlashCommandContext(TestData.getUser(), TestData.getRoom(), []);

        await Expect(() => ascm.executeCommand('nope', context)).not.toThrowAsync();
        await Expect(() => ascm.executeCommand('it-exists', context)).not.toThrowAsync();
        await Expect(() => ascm.executeCommand('command', context)).not.toThrowAsync();
        await Expect(() => ascm.executeCommand('not-registered', context)).not.toThrowAsync();
        await Expect(() => ascm.executeCommand('disabled-command', context)).not.toThrowAsync();

        const classContext = new SlashCommandContext(TestData.getUser(), new Room(TestData.getRoom(), this.mockManager), []);
        await Expect(() => ascm.executeCommand('it-exists', classContext)).not.toThrowAsync();

        // set it up for no "no app failure"
        const failedItems = new Map<string, AppSlashCommand>();
        const asm = new AppSlashCommand(this.mockApp, TestData.getSlashCommand('failure'));
        asm.hasBeenRegistered();
        failedItems.set('failure', asm);
        (ascm as any).providedCommands.set('failMePlease', failedItems);
        (ascm as any).touchedCommandsToApps.set('failure', 'failMePlease');
        await Expect(() => ascm.executeCommand('failure', context)).not.toThrowAsync();

        AppSlashCommandManagerTestFixture.doThrow = true;
        await Expect(() => ascm.executeCommand('command', context)).not.toThrowAsync();
        AppSlashCommandManagerTestFixture.doThrow = false;
    }

    @AsyncTest()
    public async getPreviews() {
        const ascm = new AppSlashCommandManager(this.mockManager);
        await ascm.addCommand('testing', TestData.getSlashCommand('command'));
        await ascm.addCommand('testing', TestData.getSlashCommand('not-registered'));
        await ascm.addCommand('testing', TestData.getSlashCommand('disabled-command'));
        await ascm.disableCommand('testing', 'not-registered');
        await ascm.registerCommands('testing');
        (ascm as any).providedCommands.get('testing').get('disabled-command').isDisabled = true;
        await ascm.modifyCommand('testing', TestData.getSlashCommand('it-exists'));

        const context = new SlashCommandContext(TestData.getUser(), TestData.getRoom(), ['testing']);

        await Expect(() => ascm.getPreviews('nope', context)).not.toThrowAsync();
        await Expect(() => ascm.getPreviews('it-exists', context)).not.toThrowAsync();
        await Expect(() => ascm.getPreviews('command', context)).not.toThrowAsync();
        await Expect(() => ascm.getPreviews('not-registered', context)).not.toThrowAsync();
        await Expect(() => ascm.getPreviews('disabled-command', context)).not.toThrowAsync();

        const classContext = new SlashCommandContext(TestData.getUser(), new Room(TestData.getRoom(), this.mockManager), []);
        await Expect(() => ascm.getPreviews('it-exists', classContext)).not.toThrowAsync();

        // set it up for no "no app failure"
        const failedItems = new Map<string, AppSlashCommand>();
        const asm = new AppSlashCommand(this.mockApp, TestData.getSlashCommand('failure'));
        asm.hasBeenRegistered();
        failedItems.set('failure', asm);
        (ascm as any).providedCommands.set('failMePlease', failedItems);
        (ascm as any).touchedCommandsToApps.set('failure', 'failMePlease');
        await Expect(() => ascm.getPreviews('failure', context)).not.toThrowAsync();

        // TODO: Figure out how tests can mock/test the result now that we care about it
    }

    @AsyncTest()
    public async executePreview() {
        const previewItem = {} as ISlashCommandPreviewItem;
        const ascm = new AppSlashCommandManager(this.mockManager);
        await ascm.addCommand('testing', TestData.getSlashCommand('command'));
        await ascm.addCommand('testing', TestData.getSlashCommand('not-registered'));
        await ascm.addCommand('testing', TestData.getSlashCommand('disabled-command'));
        await ascm.disableCommand('testing', 'not-registered');
        await ascm.registerCommands('testing');
        (ascm as any).providedCommands.get('testing').get('disabled-command').isDisabled = true;
        await ascm.modifyCommand('testing', TestData.getSlashCommand('it-exists'));

        const context = new SlashCommandContext(TestData.getUser(), TestData.getRoom(), ['testing']);

        await Expect(() => ascm.executePreview('nope', previewItem, context)).not.toThrowAsync();
        await Expect(() => ascm.executePreview('it-exists', previewItem, context)).not.toThrowAsync();
        await Expect(() => ascm.executePreview('command', previewItem, context)).not.toThrowAsync();
        await Expect(() => ascm.executePreview('not-registered', previewItem, context)).not.toThrowAsync();
        await Expect(() => ascm.executePreview('disabled-command', previewItem, context)).not.toThrowAsync();

        const classContext = new SlashCommandContext(TestData.getUser(), new Room(TestData.getRoom(), this.mockManager), []);
        await Expect(() => ascm.executePreview('it-exists', previewItem, classContext)).not.toThrowAsync();

        // set it up for no "no app failure"
        const failedItems = new Map<string, AppSlashCommand>();
        const asm = new AppSlashCommand(this.mockApp, TestData.getSlashCommand('failure'));
        asm.hasBeenRegistered();
        failedItems.set('failure', asm);
        (ascm as any).providedCommands.set('failMePlease', failedItems);
        (ascm as any).touchedCommandsToApps.set('failure', 'failMePlease');
        await Expect(() => ascm.executePreview('failure', previewItem, context)).not.toThrowAsync();
    }
}

import type { IHttp, IModify, IPersistence, IRead } from '../../../src/definition/accessors';
import type { ISlashCommand, SlashCommandContext } from '../../../src/definition/slashcommands';
import { CommandBridge } from '../../../src/server/bridges';
import { TestData } from '../utilities';

export class TestsCommandBridge extends CommandBridge {
    public commands: Map<string, (context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp, persis: IPersistence) => void>;

    constructor() {
        super();
        this.commands = new Map<string, (context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp, persis: IPersistence) => void>();
        this.commands.set('it-exists', TestData.getSlashCommand('it-exists').executor);
    }

    public async doesCommandExist(command: string, appId: string): Promise<boolean> {
        return this.commands.has(command);
    }

    public async enableCommand(command: string, appId: string): Promise<void> {}

    public async disableCommand(command: string, appId: string): Promise<void> {}

    public async modifyCommand(command: ISlashCommand, appId: string): Promise<void> {}

    public restoreCommand(comand: string, appId: string): void {}

    public async registerCommand(command: ISlashCommand, appId: string): Promise<void> {
        if (this.commands.has(command.command)) {
            throw new Error(`Command "${command.command}" has already been registered.`);
        }

        this.commands.set(command.command, command.executor);
    }

    public async unregisterCommand(command: string, appId: string): Promise<void> {
        this.commands.delete(command);
    }
}

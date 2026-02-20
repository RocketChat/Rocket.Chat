
import {
    IAppAccessors,
    IConfigurationExtend,
    IHttp,
    ILogger,
    IModify,
    IPersistence,
    IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import {
    ISlashCommand,
    SlashCommandContext,
} from '@rocket.chat/apps-engine/definition/slashcommands';

export class DeleteNotifyUserApp extends App {
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    public async extendConfiguration(
        configuration: IConfigurationExtend
    ): Promise<void> {
        await configuration.slashCommands.provideSlashCommand(
            new TestDeleteCommand()
        );
    }
}

class TestDeleteCommand implements ISlashCommand {
    public command = 'test-delete-notify';
    public i18nParamsExample = '';
    public i18nDescription = 'Tests the deleteNotifyUser API';
    public providesPreview = false;

    public async executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence
    ): Promise<void> {
        const user = context.getSender();
        const room = context.getRoom();
        const notifier = modify.getNotifier();

        // 1. Construct the message
        const message: IMessage = notifier
            .getMessageBuilder()
            .setRoom(room)
            .setText('This message will be deleted in 3 seconds.')
            .getMessage();

        // VERY IMPORTANT:
        // Because ephemeral messages are not stored in the database, the bridge does not
        // return an ID for them. We must assign an ID manually to ensure we can
        // reference the SAME message in the delete call.
        message.id = 'test-delete-id-' + Date.now();

        // 2. Notify the user
        await notifier.notifyUser(user, message);

        // 3. Wait for 3 seconds
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // 4. Delete the notification
        await notifier.deleteNotifyUser(user, message);
    }
}

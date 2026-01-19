import { settingsRegistry } from '../../app/settings/server';

export const createStandupSettings = () =>
    settingsRegistry.addGroup('Standup_Bot', async function () {
        await this.add('Standup_Bot_Enabled', false, {
            type: 'boolean',
            i18nLabel: 'Enable_Standup_Bot',
            i18nDescription: 'Enable_Standup_Bot_Description',
        });

        await this.add('Standup_Bot_Cron', '0 9 * * 1-5', {
            type: 'string',
            i18nLabel: 'Standup_Bot_Schedule',
            i18nDescription: 'Standup_Bot_Schedule_Description',
            enableQuery: { _id: 'Standup_Bot_Enabled', value: true },
        });

        await this.add('Standup_Bot_Channel', 'daily-standup', {
            type: 'string',
            i18nLabel: 'Standup_Bot_Channel',
            i18nDescription: 'Standup_Bot_Channel_Description',
            enableQuery: { _id: 'Standup_Bot_Enabled', value: true },
        });

        await this.add('Standup_Bot_Users', '', {
            type: 'string',
            i18nLabel: 'Standup_Bot_Users',
            i18nDescription: 'Standup_Bot_Users_Description',
            enableQuery: { _id: 'Standup_Bot_Enabled', value: true },
        });
    });

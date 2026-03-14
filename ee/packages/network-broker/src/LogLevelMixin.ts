import type { LogLevelSetting } from '@rocket.chat/logger';
import { logLevel } from '@rocket.chat/logger';
import { Settings } from '@rocket.chat/models';
import type { ServiceSchema, Context } from 'moleculer';

export const LogLevel: ServiceSchema = {
	name: 'LogLevel',
	async started() {
		const LogLevel = await Settings.getValueById('Log_Level');
		if (LogLevel) {
			logLevel.emit('changed', LogLevel as LogLevelSetting);
		}
	},
	events: {
		'watch.settings': {
			handler(ctx: Context<[{ clientAction: string; setting: { _id: string; value: string } }]>) {
				const [{ setting }] = ctx.params;

				if (setting._id !== 'Log_Level') {
					return;
				}
				logLevel.emit('changed', setting.value as LogLevelSetting);
			},
		},
	},
};

import { api } from '@rocket.chat/core-services';
import { Users } from '@rocket.chat/models';
import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { settings } from '../../settings/server';
import { slashCommands } from '../../utils/lib/slashCommand';
import { i18n } from '../../../server/lib/i18n';

interface IHelpCommand {
	key: string;
	command: string;
}

slashCommands.add({
	command: 'verify',
	callback: async function Verify({ message, userId }: SlashCommandCallbackParams<'verify'>): Promise<void> {
		const user = await Users.findOneById(userId);

		const keys: IHelpCommand[] = [
			{
				key: 'Open_channel_user_search',
				command: 'Command (or Ctrl) + p OR Command (or Ctrl) + k',
			},
			{
				key: 'Mark_all_as_read',
				command: 'Shift (or Ctrl) + ESC',
			},
			{
				key: 'Edit_previous_message',
				command: 'Up Arrow',
			},
			{
				key: 'Move_beginning_message',
				command: 'Command (or Alt) + Left Arrow',
			},
			{
				key: 'Move_beginning_message',
				command: 'Command (or Alt) + Up Arrow',
			},
			{
				key: 'Move_end_message',
				command: 'Command (or Alt) + Right Arrow',
			},
			{
				key: 'Move_end_message',
				command: 'Command (or Alt) + Down Arrow',
			},
			{
				key: 'New_line_message_compose_input',
				command: 'Shift + Enter',
			},
		];
		let msg = '';
		keys.forEach((key) => {
			msg = `${msg}\n${i18n.t(key.key, {
				postProcess: 'sprintf',
				sprintf: [key.command],
				lng: user?.language || settings.get('language') || 'en',
			})}`;
		});
		void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
			msg,
		});
	},
	options: {
		description: 'Start_the_verification_process',
	},
});

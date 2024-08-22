import { api } from '@rocket.chat/core-services';
import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { i18n } from '../../../server/lib/i18n';
import { settings } from '../../settings/server';
import { slashCommands } from '../../utils/server/slashCommand';

/*
 * Help is a named function that will replace /help commands
 * @param {Object} message - The message object
 */

interface IHelpCommand {
	key: string;
	command: string;
}

slashCommands.add({
	command: 'help',
	callback: async function Help({ message, userId }: SlashCommandCallbackParams<'help'>): Promise<void> {
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
		description: 'Show_the_keyboard_shortcut_list',
	},
});

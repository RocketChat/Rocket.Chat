import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { slashCommands } from '../../utils';
import { api } from '../../../server/sdk/api';

/*
 * Help is a named function that will replace /join commands
 * @param {Object} message - The message object
 */

slashCommands.add(
	'help',
	function Help(command, params, item) {
		const user = Meteor.users.findOne(Meteor.userId());
		const keys = [
			{
				Open_channel_user_search: 'Command (or Ctrl) + p OR Command (or Ctrl) + k',
			},
			{
				Mark_all_as_read: 'Shift (or Ctrl) + ESC',
			},
			{
				Edit_previous_message: 'Up Arrow',
			},
			{
				Move_beginning_message: 'Command (or Alt) + Left Arrow',
			},
			{
				Move_beginning_message: 'Command (or Alt) + Up Arrow',
			},
			{
				Move_end_message: 'Command (or Alt) + Right Arrow',
			},
			{
				Move_end_message: 'Command (or Alt) + Down Arrow',
			},
			{
				New_line_message_compose_input: 'Shift + Enter',
			},
		];
		keys.forEach((key) => {
			api.broadcast('notify.ephemeralMessage', Meteor.userId(), item.rid, {
				msg: TAPi18n.__(
					Object.keys(key)[0],
					{
						postProcess: 'sprintf',
						sprintf: [key[Object.keys(key)[0]]],
					},
					user.language,
				),
			});
		});
	},
	{
		description: 'Show_the_keyboard_shortcut_list',
	},
);

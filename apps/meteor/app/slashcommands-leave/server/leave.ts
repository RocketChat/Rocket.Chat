import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import type { IMessage } from '@rocket.chat/core-typings';

import { slashCommands } from '../../utils/lib/slashCommand';
import { settings } from '../../settings/server';
import { api } from '../../../server/sdk/api';
import { Users } from '../../models/server';

/*
 * Leave is a named function that will replace /leave commands
 * @param {Object} message - The message object
 */
function Leave(_command: string, _params: string, item: IMessage): void {
	try {
		Meteor.call('leaveRoom', item.rid);
	} catch ({ error }) {
		const userId = Meteor.userId() as string;
		if (typeof error !== 'string') {
			return;
		}
		const user = Users.findOneById(userId);
		api.broadcast('notify.ephemeralMessage', userId, item.rid, {
			msg: TAPi18n.__(error, { lng: user?.language || settings.get('Language') || 'en' }),
		});
	}
}

slashCommands.add('leave', Leave, {
	description: 'Leave_the_current_channel',
	permission: ['leave-c', 'leave-p'],
});
slashCommands.add('part', Leave, {
	description: 'Leave_the_current_channel',
	permission: ['leave-c', 'leave-p'],
});

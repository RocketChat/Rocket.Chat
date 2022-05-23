import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import type { IMessage } from '@rocket.chat/core-typings';

import { slashCommands } from '../../utils/lib/slashCommand';
import { settings } from '../../settings/server';
import { api } from '../../../server/sdk/api';
import { Users } from '../../models/server';

function Status(_command: 'status', params: string, item: IMessage): void {
	const userId = Meteor.userId() as string;

	Meteor.call('setUserStatus', null, params, (err: Meteor.Error) => {
		const user = userId && Users.findOneById(userId, { fields: { language: 1 } });
		const lng = user?.language || settings.get('Language') || 'en';

		if (err) {
			if (err.error === 'error-not-allowed') {
				api.broadcast('notify.ephemeralMessage', userId, item.rid, {
					msg: TAPi18n.__('StatusMessage_Change_Disabled', { lng }),
				});
			}

			throw err;
		} else {
			api.broadcast('notify.ephemeralMessage', userId, item.rid, {
				msg: TAPi18n.__('StatusMessage_Changed_Successfully', { lng }),
			});
		}
	});
}

slashCommands.add('status', Status, {
	description: 'Slash_Status_Description',
	params: 'Slash_Status_Params',
});

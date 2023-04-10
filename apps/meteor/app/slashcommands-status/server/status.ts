import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { api } from '@rocket.chat/core-services';
import { Users } from '@rocket.chat/models';

import { slashCommands } from '../../utils/lib/slashCommand';
import { settings } from '../../settings/server';

slashCommands.add({
	command: 'status',
	callback: async function Status(_command: 'status', params, item): Promise<void> {
		const userId = Meteor.userId();
		if (!userId) {
			return;
		}

		const user = await Users.findOneById(userId, { projection: { language: 1 } });
		const lng = user?.language || settings.get('Language') || 'en';

		try {
			await Meteor.callAsync('setUserStatus', null, params);

			void api.broadcast('notify.ephemeralMessage', userId, item.rid, {
				msg: TAPi18n.__('StatusMessage_Changed_Successfully', { lng }),
			});
		} catch (err: any) {
			if (err.error === 'error-not-allowed') {
				void api.broadcast('notify.ephemeralMessage', userId, item.rid, {
					msg: TAPi18n.__('StatusMessage_Change_Disabled', { lng }),
				});
			}

			throw err;
		}
	},
	options: {
		description: 'Slash_Status_Description',
		params: 'Slash_Status_Params',
	},
});

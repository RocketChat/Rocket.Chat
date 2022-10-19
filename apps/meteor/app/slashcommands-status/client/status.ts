import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { slashCommands } from '../../utils/lib/slashCommand';
import { settings } from '../../settings/server';
import { api } from '../../../server/sdk/api';
import { dispatchToastMessage } from '../../../client/lib/toast';

slashCommands.add({
	command: 'status',
	callback: function Status(_command, params, item): void {
		const userId = Meteor.userId() as string;

		Meteor.call('setUserStatus', null, params, (error: Meteor.Error) => {
			if (error) {
				dispatchToastMessage({ type: 'error', message: error });
				return;
			}
			api.broadcast('notify.ephemeralMessage', userId, item.rid, {
				msg: TAPi18n.__('StatusMessage_Changed_Successfully', { lng: settings.get('Language') || 'en' }),
			});
		});
	},
	options: {
		description: 'Slash_Status_Description',
		params: 'Slash_Status_Params',
	},
});

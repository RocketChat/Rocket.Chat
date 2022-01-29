import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { slashCommands } from '../../utils/lib/slashCommand';
import { settings } from '../../settings/server';
import { api } from '../../../server/sdk/api';
import * as handler from '../../../client/lib/utils/handleError';

function Status(_command: 'status', params: string, item: Record<string, string>): void | string | JQuery<HTMLElement> | undefined {
	const userId = Meteor.userId() as string;

	Meteor.call('setUserStatus', null, params, (err: Meteor.Error) => {
		if (err) {
			if (Meteor.isClient) {
				console.log(handler);
				return;
			}

			if (err.error === 'error-not-allowed') {
				api.broadcast('notify.ephemeralMessage', userId, item.rid, {
					msg: TAPi18n.__('StatusMessage_Change_Disabled', { lng: settings.get('Language') || 'en' }),
				});
			}

			throw err;
		} else {
			api.broadcast('notify.ephemeralMessage', userId, item.rid, {
				msg: TAPi18n.__('StatusMessage_Changed_Successfully', { lng: settings.get('Language') || 'en' }),
			});
		}
	});
}

slashCommands.add(
	'status',
	Status,
	{
		description: 'Slash_Status_Description',
		params: 'Slash_Status_Params',
	},
	undefined,
	false,
	undefined,
	undefined,
);

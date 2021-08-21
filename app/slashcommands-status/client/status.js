import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { Random } from 'meteor/random';

import { handleError, slashCommands } from '../../utils/client';
import { Notifications } from '../../notifications/client';

function Status(command, params, item) {
	if (command === 'status') {
		const user = Meteor.users.findOne(Meteor.userId());

		Meteor.call('setUserStatus', null, params, (err) => {
			if (err) {
				if (err.error === 'error-not-allowed') {
					Notifications.notifyUser(Meteor.userId(), 'message', {
						_id: Random.id(),
						rid: item.rid,
						ts: new Date(),
						msg: TAPi18n.__('StatusMessage_Change_Disabled', null, user.language),
					});
				}

				return handleError(err);
			}
			Notifications.notifyUser(Meteor.userId(), 'message', {
				_id: Random.id(),
				rid: item.rid,
				ts: new Date(),
				msg: TAPi18n.__('StatusMessage_Changed_Successfully', null, user.language),
			});
		});
	}
}

slashCommands.add('status', Status, {
	description: 'Slash_Status_Description',
	params: 'Slash_Status_Params',
});

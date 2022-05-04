import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { Random } from 'meteor/random';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { slashCommands } from '../../utils';
import { Users } from '../../models';
import { api } from '../../../server/sdk/api';

/*
 * Msg is a named function that will replace /msg commands
 */

function Msg(command, params, item) {
	if (command !== 'msg' || !Match.test(params, String)) {
		return;
	}
	const trimmedParams = params.trim();
	const separator = trimmedParams.indexOf(' ');
	const user = Meteor.users.findOne(Meteor.userId());
	if (separator === -1) {
		return api.broadcast('notify.ephemeralMessage', Meteor.userId(), item.rid, {
			msg: TAPi18n.__('Username_and_message_must_not_be_empty', null, user.language),
		});
	}
	const message = trimmedParams.slice(separator + 1);
	const targetUsernameOrig = trimmedParams.slice(0, separator);
	const targetUsername = targetUsernameOrig.replace('@', '');
	const targetUser = Users.findOneByUsernameIgnoringCase(targetUsername);
	if (targetUser == null) {
		api.broadcast('notify.ephemeralMessage', Meteor.userId(), item.rid, {
			msg: TAPi18n.__(
				'Username_doesnt_exist',
				{
					postProcess: 'sprintf',
					sprintf: [targetUsernameOrig],
				},
				user.language,
			),
		});
		return;
	}
	const { rid } = Meteor.call('createDirectMessage', targetUsername);
	const msgObject = {
		_id: Random.id(),
		rid,
		msg: message,
	};
	Meteor.call('sendMessage', msgObject);
}

slashCommands.add('msg', Msg, {
	description: 'Direct_message_someone',
	params: '@username <message>',
	permission: 'create-d',
});

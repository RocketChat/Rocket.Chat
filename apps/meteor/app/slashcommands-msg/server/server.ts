import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import type { IMessage } from '@rocket.chat/core-typings';

import { slashCommands } from '../../utils/lib/slashCommand';
import { settings } from '../../settings/server';
import { Users } from '../../models/server';
import { api } from '../../../server/sdk/api';

/*
 * Msg is a named function that will replace /msg commands
 */

function Msg(_command: 'msg', params: string, item: IMessage): void {
	const trimmedParams = params.trim();
	const separator = trimmedParams.indexOf(' ');
	const userId = Meteor.userId() as string;
	if (separator === -1) {
		api.broadcast('notify.ephemeralMessage', userId, item.rid, {
			msg: TAPi18n.__('Username_and_message_must_not_be_empty', { lng: settings.get('Language') || 'en' }),
		});
		return;
	}
	const message = trimmedParams.slice(separator + 1);
	const targetUsernameOrig = trimmedParams.slice(0, separator);
	const targetUsername = targetUsernameOrig.replace('@', '');
	const targetUser = Users.findOneByUsernameIgnoringCase(targetUsername);
	if (targetUser == null) {
		const user = Users.findOneById(userId, { fields: { language: 1 } });
		api.broadcast('notify.ephemeralMessage', userId, item.rid, {
			msg: TAPi18n.__('Username_doesnt_exist', {
				postProcess: 'sprintf',
				sprintf: [targetUsernameOrig],
				lng: user?.language || settings.get('Language') || 'en',
			}),
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

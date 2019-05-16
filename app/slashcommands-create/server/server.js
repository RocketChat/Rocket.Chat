import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { Random } from 'meteor/random';
import { TAPi18n } from 'meteor/tap:i18n';

import { settings } from '../../settings';
import { Notifications } from '../../notifications';
import { Rooms } from '../../models';
import { slashCommands } from '../../utils';

function Create(command, params, item) {
	function getParams(str) {
		const regex = /(--(\w+))+/g;
		const result = [];
		let m;
		while ((m = regex.exec(str)) !== null) {
			if (m.index === regex.lastIndex) {
				regex.lastIndex++;
			}
			result.push(m[2]);
		}
		return result;
	}

	const regexp = new RegExp(settings.get('UTF8_Names_Validation'));

	if (command !== 'create' || !Match.test(params, String)) {
		return;
	}
	let channel = regexp.exec(params.trim());
	channel = channel ? channel[0] : '';
	if (channel === '') {
		return;
	}

	const user = Meteor.users.findOne(Meteor.userId());
	const room = Rooms.findOneByName(channel);
	if (room != null) {
		Notifications.notifyUser(Meteor.userId(), 'message', {
			_id: Random.id(),
			rid: item.rid,
			ts: new Date(),
			msg: TAPi18n.__('Channel_already_exist', {
				postProcess: 'sprintf',
				sprintf: [channel],
			}, user.language),
		});
		return;
	}

	if (getParams(params).indexOf('private') > -1) {
		return Meteor.call('createPrivateGroup', channel, []);
	}

	Meteor.call('createChannel', channel, []);
}

slashCommands.add('create', Create, {
	description: 'Create_A_New_Channel',
	params: '#channel',
});

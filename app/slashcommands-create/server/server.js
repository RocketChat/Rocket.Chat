import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { settings } from '../../settings';
import { Rooms } from '../../models';
import { slashCommands } from '../../utils';
import { api } from '../../../server/sdk/api';

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
		api.broadcast('notify.ephemeralMessage', Meteor.userId(), item.rid, {
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
	permission: ['create-c', 'create-p'],
});

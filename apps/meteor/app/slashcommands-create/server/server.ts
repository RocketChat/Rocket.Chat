import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { IMessage } from '@rocket.chat/core-typings';

import { settings } from '../../settings/server';
import { Rooms } from '../../models/server';
import { slashCommands } from '../../utils/lib/slashCommand';
import { api } from '../../../server/sdk/api';

function Create(_command: 'create', params: string, item: IMessage): void {
	function getParams(str: string): string[] {
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

	const regexp = new RegExp(settings.get('UTF8_Channel_Names_Validation') as string);

	const channel = regexp.exec(params.trim());

	if (!channel) {
		return;
	}

	const channelStr: string = channel ? channel[0] : '';
	if (channelStr === '') {
		return;
	}
	const userId = Meteor.userId() as string;

	const room = Rooms.findOneByName(channelStr);
	if (room != null) {
		api.broadcast('notify.ephemeralMessage', userId, item.rid, {
			msg: TAPi18n.__('Channel_already_exist', {
				postProcess: 'sprintf',
				sprintf: [channelStr],
				lng: settings.get('Language') || 'en',
			}),
		});
		return;
	}

	if (getParams(params).indexOf('private') > -1) {
		return Meteor.call('createPrivateGroup', channelStr, []);
	}

	Meteor.call('createChannel', channelStr, []);
}

slashCommands.add('create', Create, {
	description: 'Create_A_New_Channel',
	params: '#channel',
	permission: ['create-c', 'create-p'],
});

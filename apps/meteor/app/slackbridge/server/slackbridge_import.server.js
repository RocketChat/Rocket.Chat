import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { api } from '@rocket.chat/core-services';

import { SlackBridge } from './slackbridge';
import { Rooms } from '../../models/server';
import { slashCommands } from '../../utils/server';

async function SlackBridgeImport(command, params, item) {
	if (command !== 'slackbridge-import' || !Match.test(params, String)) {
		return;
	}

	const room = Rooms.findOneById(item.rid);
	const channel = room.name;
	const user = Meteor.users.findOne(Meteor.userId());

	void api.broadcast('notify.ephemeralMessage', user._id, item.rid, {
		msg: TAPi18n.__(
			'SlackBridge_start',
			{
				postProcess: 'sprintf',
				sprintf: [user.username, channel],
			},
			user.language,
		),
	});

	try {
		for await (const slack of SlackBridge.slackAdapters) {
			await slack.importMessages(item.rid, (error) => {
				if (error) {
					void api.broadcast('notify.ephemeralMessage', user._id, item.rid, {
						msg: TAPi18n.__(
							'SlackBridge_error',
							{
								postProcess: 'sprintf',
								sprintf: [channel, error.message],
							},
							user.language,
						),
					});
				} else {
					void api.broadcast('notify.ephemeralMessage', user._id, item.rid, {
						msg: TAPi18n.__(
							'SlackBridge_finish',
							{
								postProcess: 'sprintf',
								sprintf: [channel],
							},
							user.language,
						),
					});
				}
			});
		}
	} catch (error) {
		void api.broadcast('notify.ephemeralMessage', user._id, item.rid, {
			msg: TAPi18n.__(
				'SlackBridge_error',
				{
					postProcess: 'sprintf',
					sprintf: [channel, error.message],
				},
				user.language,
			),
		});
		throw error;
	}
}

slashCommands.add({ command: 'slackbridge-import', callback: SlackBridgeImport });

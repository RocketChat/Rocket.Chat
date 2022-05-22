import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { Random } from 'meteor/random';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { SlackBridge } from './slackbridge';
import { Rooms } from '../../models';
import { msgStream } from '../../lib';
import { slashCommands } from '../../utils';

function SlackBridgeImport(command, params, item) {
	if (command !== 'slackbridge-import' || !Match.test(params, String)) {
		return;
	}

	const room = Rooms.findOneById(item.rid);
	const channel = room.name;
	const user = Meteor.users.findOne(Meteor.userId());

	msgStream.emit(item.rid, {
		_id: Random.id(),
		rid: item.rid,
		u: { username: 'rocket.cat' },
		ts: new Date(),
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
		SlackBridge.slackAdapters.forEach((slack) => {
			slack.importMessages(item.rid, (error) => {
				if (error) {
					msgStream.emit(item.rid, {
						_id: Random.id(),
						rid: item.rid,
						u: { username: 'rocket.cat' },
						ts: new Date(),
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
					msgStream.emit(item.rid, {
						_id: Random.id(),
						rid: item.rid,
						u: { username: 'rocket.cat' },
						ts: new Date(),
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
		});
	} catch (error) {
		msgStream.emit(item.rid, {
			_id: Random.id(),
			rid: item.rid,
			u: { username: 'rocket.cat' },
			ts: new Date(),
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

slashCommands.add('slackbridge-import', SlackBridgeImport);

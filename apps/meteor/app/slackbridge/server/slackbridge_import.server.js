import { Rooms, Users } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import { Match } from 'meteor/check';

import { i18n } from '../../../server/lib/i18n';
import { msgStream } from '../../lib/server';
import { slashCommands } from '../../utils/server/slashCommand';
import { SlackBridge } from './slackbridge';

async function SlackBridgeImport({ command, params, message, userId }) {
	if (command !== 'slackbridge-import' || !Match.test(params, String)) {
		return;
	}

	const room = await Rooms.findOneById(message.rid);
	const channel = room.name;
	const user = await Users.findOneById(userId);

	msgStream.emit(message.rid, {
		_id: Random.id(),
		rid: message.rid,
		u: { username: 'rocket.cat' },
		ts: new Date(),
		msg: i18n.t(
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
			await slack.importMessages(message.rid, (error) => {
				if (error) {
					msgStream.emit(message.rid, {
						_id: Random.id(),
						rid: message.rid,
						u: { username: 'rocket.cat' },
						ts: new Date(),
						msg: i18n.t(
							'SlackBridge_error',
							{
								postProcess: 'sprintf',
								sprintf: [channel, error.message],
							},
							user.language,
						),
					});
				} else {
					msgStream.emit(message.rid, {
						_id: Random.id(),
						rid: message.rid,
						u: { username: 'rocket.cat' },
						ts: new Date(),
						msg: i18n.t(
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
		msgStream.emit(message.rid, {
			_id: Random.id(),
			rid: message.rid,
			u: { username: 'rocket.cat' },
			ts: new Date(),
			msg: i18n.t(
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

import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { Random } from '@rocket.chat/random';
import { Rooms, Users } from '@rocket.chat/models';
import { Translation } from '@rocket.chat/core-services';

import { SlackBridge } from './slackbridge';
import { msgStream } from '../../lib/server';
import { slashCommands } from '../../utils/server';

async function SlackBridgeImport(command, params, item) {
	if (command !== 'slackbridge-import' || !Match.test(params, String)) {
		return;
	}

	const room = await Rooms.findOneById(item.rid);
	const channel = room.name;
	const user = await Users.findOneById(Meteor.userId());

	msgStream.emit(item.rid, {
		_id: Random.id(),
		rid: item.rid,
		u: { username: 'rocket.cat' },
		ts: new Date(),
		msg: await Translation.translateText('SlackBridge_start', user.language, {
			sprintf: [user.username, channel],
		}),
	});

	try {
		for await (const slack of SlackBridge.slackAdapters) {
			await slack.importMessages(item.rid, async (error) => {
				if (error) {
					msgStream.emit(item.rid, {
						_id: Random.id(),
						rid: item.rid,
						u: { username: 'rocket.cat' },
						ts: new Date(),
						msg: await Translation.translateText('SlackBridge_error', user.language, {
							sprintf: [channel, error.message],
						}),
					});
				} else {
					msgStream.emit(item.rid, {
						_id: Random.id(),
						rid: item.rid,
						u: { username: 'rocket.cat' },
						ts: new Date(),
						msg: await Translation.translateText('SlackBridge_finish', user.language, {
							sprintf: [channel],
						}),
					});
				}
			});
		}
	} catch (error) {
		msgStream.emit(item.rid, {
			_id: Random.id(),
			rid: item.rid,
			u: { username: 'rocket.cat' },
			ts: new Date(),
			msg: await Translation.translateText('SlackBridge_error', user.language, {
				sprintf: [channel, error.message],
			}),
		});
		throw error;
	}
}

slashCommands.add({ command: 'slackbridge-import', callback: SlackBridgeImport });

// This is a JS File that was renamed to TS so it won't lose its git history when converted to TS
// TODO: Remove the following lint/ts instructions when the file gets properly converted
/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { Rooms, Users } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import { Match } from 'meteor/check';

import { SlackBridge } from './slackbridge';
import { i18n } from '../../lib/i18n';
import { msgStream } from '../../lib/messaging/msgStream';
import { slashCommands } from '../../lib/utils/slashCommand';

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
		msg: i18n.t('SlackBridge_start', {
			username: user.username,
			channelName: channel,
			interpolation: { escapeValue: false },
			lng: user.language,
		}),
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
						msg: i18n.t('SlackBridge_error', {
							channelName: channel,
							errorMessage: error.message,
							interpolation: { escapeValue: false },
							lng: user.language,
						}),
					});
				} else {
					msgStream.emit(message.rid, {
						_id: Random.id(),
						rid: message.rid,
						u: { username: 'rocket.cat' },
						ts: new Date(),
						msg: i18n.t('SlackBridge_finish', {
							channelName: channel,
							interpolation: { escapeValue: false },
							lng: user.language,
						}),
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
			msg: i18n.t('SlackBridge_error', {
				channelName: channel,
				errorMessage: error.message,
				interpolation: { escapeValue: false },
				lng: user.language,
			}),
		});
		throw error;
	}
}

slashCommands.add({ command: 'slackbridge-import', callback: SlackBridgeImport });

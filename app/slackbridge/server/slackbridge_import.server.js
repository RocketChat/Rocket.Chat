import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { Random } from 'meteor/random';
import { TAPi18n } from 'meteor/tap:i18n';
import { Rooms } from '/app/models';
import { msgStream } from '/app/lib';
import { slashCommands } from '/app/utils';
import { SlackBridge } from './slackbridge';

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
		msg: TAPi18n.__('SlackBridge_start', {
			postProcess: 'sprintf',
			sprintf: [user.username, channel],
		}, user.language),
	});

	try {
		SlackBridge.importMessages(item.rid, (error) => {
			if (error) {
				msgStream.emit(item.rid, {
					_id: Random.id(),
					rid: item.rid,
					u: { username: 'rocket.cat' },
					ts: new Date(),
					msg: TAPi18n.__('SlackBridge_error', {
						postProcess: 'sprintf',
						sprintf: [channel, error.message],
					}, user.language),
				});
			} else {
				msgStream.emit(item.rid, {
					_id: Random.id(),
					rid: item.rid,
					u: { username: 'rocket.cat' },
					ts: new Date(),
					msg: TAPi18n.__('SlackBridge_finish', {
						postProcess: 'sprintf',
						sprintf: [channel],
					}, user.language),
				});
			}
		});
	} catch (error) {
		msgStream.emit(item.rid, {
			_id: Random.id(),
			rid: item.rid,
			u: { username: 'rocket.cat' },
			ts: new Date(),
			msg: TAPi18n.__('SlackBridge_error', {
				postProcess: 'sprintf',
				sprintf: [channel, error.message],
			}, user.language),
		});
		throw error;
	}
	return SlackBridgeImport;
}

slashCommands.add('slackbridge-import', SlackBridgeImport);

import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';
import { Rooms, Users } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';

import { SlackBridge } from './slackbridge';
import { i18n } from '../../lib/i18n';
import { msgStream } from '../../lib/messaging/msgStream';
import { slashCommands } from '../../lib/utils/slashCommand';

async function SlackBridgeImport({ command, message, userId }: SlashCommandCallbackParams<'slackbridge-import'>) {
	if (command !== 'slackbridge-import') {
		return;
	}

	const room = await Rooms.findOneById(message.rid);
	const user = await Users.findOneById(userId);
	if (!room || !user) {
		return;
	}
	const channel = room.name;

	const notify = (msg: string) => {
		const now = new Date();
		msgStream.emit(message.rid, {
			_id: Random.id(),
			rid: message.rid,
			u: { _id: 'rocket.cat', username: 'rocket.cat' },
			ts: now,
			_updatedAt: now,
			msg,
		});
	};
	const notifyError = (error: unknown) =>
		notify(
			i18n.t('SlackBridge_error', {
				channelName: channel,
				errorMessage: error instanceof Error ? error.message : String(error),
				interpolation: { escapeValue: false },
				lng: user.language,
			}),
		);

	notify(
		i18n.t('SlackBridge_start', {
			username: user.username,
			channelName: channel,
			interpolation: { escapeValue: false },
			lng: user.language,
		}),
	);

	try {
		for (const slack of SlackBridge.slackAdapters) {
			await slack.importMessages(message.rid, (error) => {
				if (error) {
					notifyError(error);
				} else {
					notify(
						i18n.t('SlackBridge_finish', {
							channelName: channel,
							interpolation: { escapeValue: false },
							lng: user.language,
						}),
					);
				}
			});
		}
	} catch (error) {
		notifyError(error);
		throw error;
	}
}

slashCommands.add({ command: 'slackbridge-import', callback: SlackBridgeImport });

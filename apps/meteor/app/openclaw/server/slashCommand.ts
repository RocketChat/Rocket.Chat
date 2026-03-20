import { api } from '@rocket.chat/core-services';
import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { forwardMessageToAgent, getRoomById } from './lib/messageHandler';
import { validateConfig } from './lib/openclawClient';
import { openclawLogger } from './logger';
import { i18n } from '../../../server/lib/i18n';
import { settings } from '../../settings/server';
import { slashCommands } from '../../utils/server/slashCommand';

const CONFIG_ERROR_KEY_MAP = {
	NOT_ENABLED: 'OpenClaw_Error_Not_Enabled',
	MISSING_API_URL: 'OpenClaw_Error_Missing_API_URL',
	MISSING_AUTH_TOKEN: 'OpenClaw_Error_Missing_Auth_Token',
} as const;

slashCommands.add({
	command: 'openclaw',
	callback: async function OpenClaw({ params, message, userId }: SlashCommandCallbackParams<'openclaw'>): Promise<void> {
		const user = await Users.findOneById(userId);
		if (!user) {
			return;
		}

		const userLanguage = user.language || settings.get('language') || 'en';

		const validation = validateConfig();
		if (!validation.valid && validation.error) {
			const i18nKey = CONFIG_ERROR_KEY_MAP[validation.error] ?? 'OpenClaw_Error_Not_Enabled';
			void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
				msg: i18n.t(i18nKey, { lng: userLanguage }),
				...(message.tmid && { tmid: message.tmid }),
			});
			return;
		}

		const prompt = params?.trim();
		if (!prompt) {
			void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
				msg: i18n.t('OpenClaw_Usage_Hint', { lng: userLanguage }),
				...(message.tmid && { tmid: message.tmid }),
			});
			return;
		}

		void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
			msg: `:hourglass_flowing_sand: ${i18n.t('OpenClaw_Processing', { lng: userLanguage })}`,
			...(message.tmid && { tmid: message.tmid }),
		});

		const room = await getRoomById(message.rid);
		if (!room) {
			openclawLogger.error({ msg: 'Room not found for slash command', roomId: message.rid });
			void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
				msg: ':x: **OpenClaw:** Room not found.',
				...(message.tmid && { tmid: message.tmid }),
			});
			return;
		}

		const agentMessage = {
			...message,
			msg: prompt,
			u: {
				_id: user._id,
				username: user.username || '',
				name: user.name || '',
			},
		};

		const responseText = await forwardMessageToAgent(agentMessage, room);

		if (!responseText) {
			void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
				msg: `:x: ${i18n.t('OpenClaw_No_Response', { lng: userLanguage })}`,
				...(message.tmid && { tmid: message.tmid }),
			});
			return;
		}

		const respondInThread = settings.get<boolean>('OpenClaw_Respond_In_Thread');

		void api.broadcast('notify.ephemeralMessage', userId, message.rid, {
			msg: responseText,
			...(respondInThread && message.tmid && { tmid: message.tmid }),
		});

		openclawLogger.info({
			msg: 'OpenClaw slash command response delivered',
			userId,
			roomId: message.rid,
		});
	},
	options: {
		description: 'OpenClaw_Slash_Description',
		params: 'OpenClaw_Slash_Params',
	},
});

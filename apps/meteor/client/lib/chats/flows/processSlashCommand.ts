import type { IMessage } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import { escapeHTML } from '@rocket.chat/tools';

import { t } from '../../../../lib/i18n';
import { sdk } from '../../SDKClient';
import { hasAtLeastOnePermission } from '../../authorization';
import { settings } from '../../settings';
import { slashCommands } from '../../slashCommand';
import type { ChatAPI } from '../ChatAPI';
import { processSlashCommandCore } from '../core/processSlashCommand';

export const processSlashCommand = (chat: ChatAPI, message: IMessage): Promise<boolean> =>
	processSlashCommandCore(
		{
			getCommand: (name) => slashCommands.commands[name],
			isUnrecognizedAllowed: () => settings.peek('Message_AllowUnrecognizedSlashCommand'),
			hasAtLeastOnePermission: (permission, rid) => hasAtLeastOnePermission(permission, rid),
			postTelemetry: (event) => sdk.rest.post('/v1/statistics.telemetry', { params: [event] }),
			runCommand: (params) => sdk.rest.post('/v1/commands.run', params),
			t: (key, options) => t(key, options),
			escapeHTML: (text) => escapeHTML(text),
			randomId: () => Random.id(),
		},
		chat,
		message,
	);

import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { sdk } from '../../lib/SDKClient';
import { slashCommands } from '../../lib/slashCommand';
import { dispatchToastMessage } from '../../lib/toast';

slashCommands.add({
	command: 'status',
	callback: async function Status({ params, userId }: SlashCommandCallbackParams<'status'>): Promise<void> {
		if (!userId) {
			return;
		}

		try {
			await sdk.rest.post('/v1/users.setStatus', { message: params });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	},
	options: {
		description: 'Slash_Status_Description',
		params: 'Slash_Status_Params',
	},
});

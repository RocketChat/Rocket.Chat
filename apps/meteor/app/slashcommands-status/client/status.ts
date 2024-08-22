import type { SlashCommandCallbackParams } from '@rocket.chat/core-typings';

import { dispatchToastMessage } from '../../../client/lib/toast';
import { sdk } from '../../utils/client/lib/SDKClient';
import { slashCommands } from '../../utils/client/slashCommand';

slashCommands.add({
	command: 'status',
	callback: async function Status({ params, userId }: SlashCommandCallbackParams<'status'>): Promise<void> {
		if (!userId) {
			return;
		}

		try {
			await sdk.call('setUserStatus', undefined, params);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	},
	options: {
		description: 'Slash_Status_Description',
		params: 'Slash_Status_Params',
	},
});

import { Meteor } from 'meteor/meteor';

import { slashCommands } from '../../utils/lib/slashCommand';
import { dispatchToastMessage } from '../../../client/lib/toast';

slashCommands.add({
	command: 'status',
	callback: async function Status(_command, params): Promise<void> {
		const userId = Meteor.userId();
		if (!userId) {
			return;
		}

		try {
			await Meteor.callAsync('setUserStatus', null, params);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	},
	options: {
		description: 'Slash_Status_Description',
		params: 'Slash_Status_Params',
	},
});

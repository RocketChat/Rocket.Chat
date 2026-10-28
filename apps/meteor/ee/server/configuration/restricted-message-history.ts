import { License } from '@rocket.chat/license';
import { Meteor } from 'meteor/meteor';

Meteor.startup(() => {
	License.onToggledFeature('restricted-message-history', {
		up: async () => {
			const { addSettings } = await import('../settings/restricted-message-history');
			await addSettings();

			await import('../hooks/restricted-message-history');
		},
	});
});

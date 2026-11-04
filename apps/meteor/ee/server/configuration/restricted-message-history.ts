import { License } from '@rocket.chat/license';

License.onToggledFeature('experimental-enterprise-features', {
	up: async () => {
		const { addSettings } = await import('../settings/restricted-message-history');
		await addSettings();

		await import('../hooks/restricted-message-history');
	},
});

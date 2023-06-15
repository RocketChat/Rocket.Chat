import { settingsRegistry } from '../../app/settings/server';

export const createDiscussionsSettings = () =>
	settingsRegistry.addGroup('Discussion', async function () {
		// the channel for which discussions are created if none is explicitly chosen

		await this.add('Discussion_enabled', true, {
			group: 'Discussion',
			i18nLabel: 'Enable',
			type: 'boolean',
			public: true,
		});
	});

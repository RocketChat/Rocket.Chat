import { settingsRegistry } from '../../settings/server';

settingsRegistry.add('Message_AllowRemind', true, {
	type: 'boolean',
	group: 'Message',
	public: true,
});

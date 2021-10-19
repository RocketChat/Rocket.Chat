import { settingsRegistry } from '../../settings/server';

settingsRegistry.add('Message_AllowStarring', true, {
	type: 'boolean',
	group: 'Message',
	public: true,
});

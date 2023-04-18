import { settingsRegistry } from '../../settings/server';

void settingsRegistry.add('Message_AllowStarring', true, {
	type: 'boolean',
	group: 'Message',
	public: true,
});

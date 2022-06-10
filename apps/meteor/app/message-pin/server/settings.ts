import { settingsRegistry } from '../../settings/server';

settingsRegistry.add('Message_AllowPinning', true, {
	type: 'boolean',
	group: 'Message',
	public: true,
});

import { settingsRegistry } from '../../settings/server';

void settingsRegistry.add('Message_AllowPinning', true, {
	type: 'boolean',
	group: 'Message',
	public: true,
});

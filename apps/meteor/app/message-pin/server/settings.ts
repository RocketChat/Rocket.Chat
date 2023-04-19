import { settingsRegistry } from '../../settings/server';

await settingsRegistry.add('Message_AllowPinning', true, {
	type: 'boolean',
	group: 'Message',
	public: true,
});

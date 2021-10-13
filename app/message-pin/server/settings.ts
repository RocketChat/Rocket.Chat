import { settingsRegister } from '../../settings/server';

settingsRegister.add('Message_AllowPinning', true, {
	type: 'boolean',
	group: 'Message',
	public: true,
});

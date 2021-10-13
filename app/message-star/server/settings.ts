import { settingsRegister } from '../../settings/server';

settingsRegister.add('Message_AllowStarring', true, {
	type: 'boolean',
	group: 'Message',
	public: true,
});

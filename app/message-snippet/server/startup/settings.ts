import { settingsRegister } from '../../../settings/server';

settingsRegister.add('Message_AllowSnippeting', false, {
	type: 'boolean',
	public: true,
	group: 'Message',
});

import { settingsRegistry } from '../../../settings/server';

settingsRegistry.add('Message_AllowSnippeting', false, {
	type: 'boolean',
	public: true,
	group: 'Message',
});

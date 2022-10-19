import { settingsRegistry } from '../../../app/settings/server';

settingsRegistry.add('Message_Read_Receipt_Enabled', false, {
	group: 'Message',
	type: 'boolean',
	public: true,
});

settingsRegistry.add('Message_Read_Receipt_Store_Users', false, {
	group: 'Message',
	type: 'boolean',
	public: true,
	enableQuery: { _id: 'Message_Read_Receipt_Enabled', value: true },
});

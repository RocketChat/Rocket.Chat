import { settingsRegistry } from '../../../../app/settings/server';

export const createSettings = (): void => {
	settingsRegistry.add('Message_Read_Receipt_Enabled', false, {
		group: 'Message',
		enterprise: true,
		modules: ['message-read-receipt'],
		type: 'boolean',
		invalidValue: false,
		public: true,
	});

	settingsRegistry.add('Message_Read_Receipt_Store_Users', false, {
		group: 'Message',
		enterprise: true,
		modules: ['message-read-receipt'],
		type: 'boolean',
		invalidValue: false,
		public: true,
		enableQuery: { _id: 'Message_Read_Receipt_Enabled', value: true },
	});
};

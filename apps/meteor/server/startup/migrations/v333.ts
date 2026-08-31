import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 333,
	name: 'Remove Voxtelesys & Mobex SMS settings by ID',
	async up() {
		const ids = [
			// Voxtelesys settings
			'SMS_Voxtelesys_authToken',
			'SMS_Voxtelesys_URL',
			'SMS_Voxtelesys_FileUpload_Enabled',
			'SMS_Voxtelesys_FileUpload_MediaTypeWhiteList',

			// Mobex settings
			'SMS_Mobex_gateway_address',
			'SMS_Mobex_gateway_address_desc',
			'SMS_Mobex_from_number',
			'SMS_Mobex_from_number_desc',
			'SMS_Mobex_from_numbers_list',
			'SMS_Mobex_from_numbers_list_desc',
			'SMS_Mobex_password',
			'SMS_Mobex_restful_address',
			'SMS_Mobex_restful_address_desc',
			'SMS_Mobex_username',
		];

		await Settings.deleteMany({
			_id: { $in: ids },
		});

		await Settings.findOneAndUpdate({ _id: 'SMS_Service', value: { $ne: 'twilio' } }, { $set: { value: 'twilio' } });
	},
});

import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { Settings } from '../../../app/models/server/raw';
import { addMigration } from '../../lib/migrations';
import { sendMessagesToAdmins } from '../../lib/sendMessagesToAdmins';

addMigration({
	version: 201,
	up: async () => {
		const pushEnabled = await Settings.findOneById('Push_enable');
		const pushGatewayEnabled = await Settings.findOneById('Push_enable_gateway');
		const registerServer = await Settings.findOneById('Register_Server');
		const cloudAgreement = await Settings.findOneById('Cloud_Service_Agree_PrivacyTerms');

		if (!pushEnabled?.value) {
			return;
		}
		if (!pushGatewayEnabled?.value) {
			return;
		}
		if (registerServer?.value && cloudAgreement?.value) {
			return;
		}

		// if push gateway is enabled but server is not registered or cloud terms not agreed, disable gateway and alert admin
		Settings.update(
			{
				_id: 'Push_enable_gateway',
			},
			{
				$set: {
					value: false,
				},
			},
			{
				update: true,
			},
		);

		const id = 'push-gateway-disabled';
		const title = 'Action_required';
		const text = 'The_mobile_notifications_were_disabled_to_all_users_go_to_Admin_Push_to_enable_the_Push_Gateway_again';
		const link = '/admin/Push';

		Meteor.startup(() => {
			sendMessagesToAdmins({
				msgs: ({ adminUser }) => [
					{
						msg: `*${TAPi18n.__(title, adminUser.language)}*\n${TAPi18n.__(text, adminUser.language)}`,
					},
				],
				banners: [
					{
						id,
						priority: 100,
						title,
						text,
						modifiers: ['danger'],
						link,
					},
				],
			});
		});
	},
});

import { Settings } from '@rocket.chat/models';
import { isPOSTLivechatAppearanceParams } from '@rocket.chat/rest-typings';

import { isTruthy } from '../../../../../lib/isTruthy';
import { API } from '../../../../api/server';
import { findAppearance } from '../../../server/api/lib/appearance';

API.v1.addRoute(
	'livechat/appearance',
	{
		authRequired: true,
		permissionsRequired: ['view-livechat-manager'],
		validateParams: {
			POST: isPOSTLivechatAppearanceParams,
		},
	},
	{
		async get() {
			const { appearance } = await findAppearance();

			return API.v1.success({
				appearance,
			});
		},
		async post() {
			const settings = this.bodyParams;

			const validSettingList = [
				'Livechat_title',
				'Livechat_title_color',
				'Livechat_enable_message_character_limit',
				'Livechat_message_character_limit',
				'Livechat_show_agent_info',
				'Livechat_show_agent_email',
				'Livechat_display_offline_form',
				'Livechat_offline_form_unavailable',
				'Livechat_offline_message',
				'Livechat_offline_success_message',
				'Livechat_offline_title',
				'Livechat_offline_title_color',
				'Livechat_offline_email',
				'Livechat_conversation_finished_message',
				'Livechat_conversation_finished_text',
				'Livechat_registration_form',
				'Livechat_name_field_registration_form',
				'Livechat_email_field_registration_form',
				'Livechat_registration_form_message',
			];

			const valid = settings.every((setting) => validSettingList.includes(setting._id));

			if (!valid) {
				throw new Error('invalid-setting');
			}

			const dbSettings = await Settings.find({ _id: { $in: validSettingList } }, { projection: { _id: 1, value: 1, type: 1 } }).toArray();

			const settingsToSave = dbSettings
				.map((dbSetting) => {
					const setting = settings.find(({ _id }) => _id === dbSetting._id);
					if (!setting || dbSetting.value === setting.value) {
						return;
					}

					switch (dbSetting?.type) {
						case 'boolean':
							return {
								_id: dbSetting._id,
								value: setting.value === 'true' || setting.value === true,
							};
						case 'int':
							return {
								_id: dbSetting._id,
								value: parseInt((setting.value as string) ?? '0', 10),
							};
						default:
							return {
								_id: dbSetting._id,
								value: setting?.value,
							};
					}
				})
				.filter(isTruthy);

			await Promise.all(
				settingsToSave.map((setting) => {
					return Settings.updateValueById(setting._id, setting.value);
				}),
			);

			return API.v1.success();
		},
	},
);

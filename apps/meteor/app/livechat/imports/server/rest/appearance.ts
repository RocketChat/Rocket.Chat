import { Settings } from '@rocket.chat/models';
import { isPOSTLivechatAppearanceParams } from '@rocket.chat/rest-typings';

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

			const settingsToSave: typeof this.bodyParams = [];
			dbSettings.forEach((dbSetting) => {
				const setting = settings.find(({ _id }) => _id === dbSetting._id);
				if (!setting || dbSetting.value === setting.value) {
					return;
				}

				switch (dbSetting?.type) {
					case 'boolean':
						settingsToSave.push({
							_id: dbSetting._id,
							value: coerceValue(setting?.value, 'boolean'),
						});
						break;
					case 'int':
						settingsToSave.push({
							_id: dbSetting._id,
							value: coerceValue(setting?.value, 'int'),
						});
						break;
					default:
						settingsToSave.push({
							_id: dbSetting._id,
							value: setting?.value,
						});
						break;
				}
			});

			await Promise.all(
				settingsToSave.map((setting) => {
					return Settings.updateValueById(setting._id, setting.value);
				}),
			);

			return API.v1.success();
		},
	},
);

type ReturnType<T> = T extends 'boolean' ? boolean : T extends 'int' ? number : string;

function coerceValue<T extends 'boolean' | 'int'>(value: string | number | boolean, type: T): ReturnType<T> {
	if (type === 'boolean') {
		return (value === 'true' || value === true) as ReturnType<T>;
	}

	if (type === 'int') {
		return parseInt((value as string) ?? '0', 10) as ReturnType<T>;
	}

	return value as ReturnType<T>;
}

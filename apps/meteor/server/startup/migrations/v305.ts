import { Settings } from '@rocket.chat/models';

import { settings } from '../../../app/settings/server';
import { addMigration } from '../../lib/migrations';

addMigration({
	version: 305,
	name: 'Update translation key on "Forgot password" e-mail body setting',
	async up() {
		const forgotPasswordEmail = settings.get<string>('Forgot_Password_Email');
		const newPackageValue =
			'<h2>{Forgot_password}</h2><p>{Lets_get_you_new_one_}</p><a class="btn" href="[Forgot_Password_Url]">{Reset}</a><p class="advice">{If_you_didnt_ask_for_reset_ignore_this_email}</p>';

		await Settings.updateOne(
			{ _id: 'Forgot_Password_Email' },
			{
				$set: {
					packageValue: newPackageValue,
					value: forgotPasswordEmail.replace(/{Lets_get_you_new_one}/g, '{Lets_get_you_new_one_}'),
				},
			},
		);
	},
});

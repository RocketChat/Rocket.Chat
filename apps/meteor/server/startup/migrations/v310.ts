import type { ISetting } from '@rocket.chat/core-typings';
import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 310,
	name: 'Update translation key on "Forgot password" e-mail body setting',
	async up() {
		const forgotPasswordEmail = await Settings.findOneById<Pick<ISetting, 'value'>>('Forgot_Password_Email', { projection: { value: 1 } });
		if (!forgotPasswordEmail) {
			return;
		}
		const newPackageValue =
			'<h2>{Forgot_password}</h2><p>{Lets_get_you_new_one_}</p><a class="btn" href="[Forgot_Password_Url]">{Reset}</a><p class="advice">{If_you_didnt_ask_for_reset_ignore_this_email}</p>';

		await Settings.updateOne(
			{ _id: 'Forgot_Password_Email' },
			{
				$set: {
					packageValue: newPackageValue,
					value: (forgotPasswordEmail.value as string).replace(/{Lets_get_you_new_one}/g, '{Lets_get_you_new_one_}'),
				},
			},
		);
	},
});

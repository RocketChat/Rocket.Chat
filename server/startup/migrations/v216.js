import { Migrations } from '../../../app/migrations';
import { Settings } from '../../../app/models';

Migrations.add({
	version: 216,
	up() {
		Settings.find({ _id: /Accounts_OAuth_Custom/, i18nLabel: 'Accounts_OAuth_Custom_Enable' }).forEach(function(customOauth) {
			const parts = customOauth._id.split('-');
			const name = parts[1];
			const id = `Accounts_OAuth_Custom-${ name }-key_field`;
			if (!Settings.findOne({ _id: id })) {
				Settings.insert({
					_id: id,
					type: 'select',
					group: 'OAuth',
					section: `Custom OAuth: ${ name }`,
					i18nLabel: 'Accounts_OAuth_Custom_Key_Field',
					persistent: true,
					values: [
						{
							key: 'username',
							i18nLabel: 'Username',
						},
						{
							key: 'email',
							i18nLabel: 'Email',
						},
					],
					packageValue: 'username',
					valueSource: 'packageValue',
					ts: new Date(),
					hidden: false,
					blocked: false,
					sorter: 103,
					i18nDescription: `Accounts_OAuth_Custom-${ name }-key_field_Description`,
					createdAt: new Date(),
					value: 'username',
				});
			}
		});
	},
});

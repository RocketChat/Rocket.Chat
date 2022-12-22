import { settingsRegistry } from '../../settings/server';

settingsRegistry.addGroup('OAuth', function () {
	this.section('Nextcloud', function () {
		const enableQuery = {
			_id: 'Accounts_OAuth_Nextcloud',
			value: true,
		};

		this.add('Accounts_OAuth_Nextcloud', false, { type: 'boolean', public: true });
		this.add('Accounts_OAuth_Nextcloud_URL', '', { type: 'string', enableQuery, public: true });
		this.add('Accounts_OAuth_Nextcloud_id', '', { type: 'string', enableQuery });
		this.add('Accounts_OAuth_Nextcloud_secret', '', { type: 'string', enableQuery });
		this.add('Accounts_OAuth_Nextcloud_callback_url', '_oauth/nextcloud', {
			type: 'relativeUrl',
			readonly: true,
			enableQuery,
		});
		this.add('Accounts_OAuth_Nextcloud_button_label_text', 'Nextcloud', {
			type: 'string',
			public: true,
			i18nLabel: 'Accounts_OAuth_Custom_Button_Label_Text',
			persistent: true,
		});
		this.add('Accounts_OAuth_Nextcloud_button_label_color', '#ffffff', {
			type: 'string',
			public: true,
			i18nLabel: 'Accounts_OAuth_Custom_Button_Label_Color',
			persistent: true,
		});
		this.add('Accounts_OAuth_Nextcloud_button_color', '#0082c9', {
			type: 'string',
			public: true,
			i18nLabel: 'Accounts_OAuth_Custom_Button_Color',
			persistent: true,
		});
	});
});

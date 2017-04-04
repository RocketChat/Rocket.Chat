// RocketChat.settings.add('Accounts_OAuth_Dolphin_URL', '', { type: 'string', group: 'OAuth', public: true, section: 'Dolphin', i18nLabel: 'URL' });
// RocketChat.settings.add('Accounts_OAuth_Dolphin', false, { type: 'boolean', group: 'OAuth', section: 'Dolphin', i18nLabel: 'Accounts_OAuth_Custom_Enable' });
// RocketChat.settings.add('Accounts_OAuth_Dolphin_id', '', { type: 'string', group: 'OAuth', section: 'Dolphin', i18nLabel: 'Accounts_OAuth_Custom_id' });
// RocketChat.settings.add('Accounts_OAuth_Dolphin_secret', '', { type: 'string', group: 'OAuth', section: 'Dolphin', i18nLabel: 'Accounts_OAuth_Custom_Secret' });
// RocketChat.settings.add('Accounts_OAuth_Dolphin_login_style', 'redirect', { type: 'select', group: 'OAuth', section: 'Dolphin', i18nLabel: 'Accounts_OAuth_Custom_Login_Style', persistent: true, values: [ { key: 'redirect', i18nLabel: 'Redirect' }, { key: 'popup', i18nLabel: 'Popup' }, { key: '', i18nLabel: 'Default' } ] });
// RocketChat.settings.add('Accounts_OAuth_Dolphin_button_label_text', '', { type: 'string', group: 'OAuth', section: 'Dolphin', i18nLabel: 'Accounts_OAuth_Custom_Button_Label_Text', persistent: true });
// RocketChat.settings.add('Accounts_OAuth_Dolphin_button_label_color', '#FFFFFF', { type: 'string', group: 'OAuth', section: 'Dolphin', i18nLabel: 'Accounts_OAuth_Custom_Button_Label_Color', persistent: true });
// RocketChat.settings.add('Accounts_OAuth_Dolphin_button_color', '#13679A', { type: 'string', group: 'OAuth', section: 'Dolphin', i18nLabel: 'Accounts_OAuth_Custom_Button_Color', persistent: true });
RocketChat.settings.addGroup('OAuth', function() {
	this.section('Drupal', function() {
		const enableQuery = {
			_id: 'Accounts_OAuth_Drupal',
			value: true
		};

		this.add('Accounts_OAuth_Drupal', false, { type: 'boolean' });
		this.add('API_Drupal_URL', '', { type: 'string', public: true, enableQuery, i18nDescription: 'API_Drupal_URL_Description' });
		this.add('Accounts_OAuth_Drupal_id', '', { type: 'string', enableQuery });
		this.add('Accounts_OAuth_Drupal_secret', '', { type: 'string', enableQuery });
		this.add('Accounts_OAuth_Drupal_callback_url', '_oauth/drupal', { type: 'relativeUrl', readonly: true, force: true, enableQuery });
	});
});

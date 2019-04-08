import { settings } from '../../settings';

settings.add('Accounts_OAuth_Dolphin_URL', '', { type: 'string', group: 'OAuth', public: true, section: 'Dolphin', i18nLabel: 'URL' });
settings.add('Accounts_OAuth_Dolphin', false, { type: 'boolean', group: 'OAuth', section: 'Dolphin', i18nLabel: 'Accounts_OAuth_Custom_Enable' });
settings.add('Accounts_OAuth_Dolphin_id', '', { type: 'string', group: 'OAuth', section: 'Dolphin', i18nLabel: 'Accounts_OAuth_Custom_id' });
settings.add('Accounts_OAuth_Dolphin_secret', '', { type: 'string', group: 'OAuth', section: 'Dolphin', i18nLabel: 'Accounts_OAuth_Custom_Secret' });
settings.add('Accounts_OAuth_Dolphin_login_style', 'redirect', { type: 'select', group: 'OAuth', section: 'Dolphin', i18nLabel: 'Accounts_OAuth_Custom_Login_Style', persistent: true, values: [{ key: 'redirect', i18nLabel: 'Redirect' }, { key: 'popup', i18nLabel: 'Popup' }, { key: '', i18nLabel: 'Default' }] });
settings.add('Accounts_OAuth_Dolphin_button_label_text', '', { type: 'string', group: 'OAuth', section: 'Dolphin', i18nLabel: 'Accounts_OAuth_Custom_Button_Label_Text', persistent: true });
settings.add('Accounts_OAuth_Dolphin_button_label_color', '#FFFFFF', { type: 'string', group: 'OAuth', section: 'Dolphin', i18nLabel: 'Accounts_OAuth_Custom_Button_Label_Color', persistent: true });
settings.add('Accounts_OAuth_Dolphin_button_color', '#1d74f5', { type: 'string', group: 'OAuth', section: 'Dolphin', i18nLabel: 'Accounts_OAuth_Custom_Button_Color', persistent: true });

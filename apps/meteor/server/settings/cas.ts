import { settingsRegistry } from '../../app/settings/server';

export const createCasSettings = () =>
	settingsRegistry.addGroup('CAS', async function () {
		await this.add('CAS_enabled', false, { type: 'boolean', group: 'CAS', public: true });
		await this.add('CAS_base_url', '', { type: 'string', group: 'CAS', public: true });
		await this.add('CAS_login_url', '', { type: 'string', group: 'CAS', public: true });
		await this.add('CAS_version', '1.0', {
			type: 'select',
			values: [
				{ key: '1.0', i18nLabel: '1.0' },
				{ key: '2.0', i18nLabel: '2.0' },
			],
			group: 'CAS',
		});
		await this.add('CAS_trust_username', false, {
			type: 'boolean',
			group: 'CAS',
			public: true,
			i18nDescription: 'CAS_trust_username_description',
		});
		// Enable/disable user creation
		await this.add('CAS_Creation_User_Enabled', true, { type: 'boolean', group: 'CAS' });

		await this.section('Attribute_handling', async function () {
			// Enable/disable sync
			await this.add('CAS_Sync_User_Data_Enabled', true, { type: 'boolean' });
			// Attribute mapping table
			await this.add('CAS_Sync_User_Data_FieldMap', '{}', { type: 'string' });
		});

		await this.section('CAS_Login_Layout', async function () {
			await this.add('CAS_popup_width', 810, { type: 'int', group: 'CAS', public: true });
			await this.add('CAS_popup_height', 610, { type: 'int', group: 'CAS', public: true });
			await this.add('CAS_button_label_text', 'CAS', { type: 'string', group: 'CAS' });
			await this.add('CAS_button_label_color', '#FFFFFF', { type: 'color', group: 'CAS' });
			await this.add('CAS_button_color', '#1d74f5', { type: 'color', group: 'CAS' });
			await this.add('CAS_autoclose', true, { type: 'boolean', group: 'CAS' });
		});
	});

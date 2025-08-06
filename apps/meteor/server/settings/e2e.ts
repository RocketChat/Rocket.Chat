import type { ISettingBase } from '@rocket.chat/core-typings';

import { settingsRegistry } from '../../app/settings/server';

export const createE2ESettings = () =>
	settingsRegistry.addGroup('End-to-end_encryption', async function () {
		await this.add('E2E_Enable', false, {
			type: 'boolean',
			i18nLabel: 'End-to-end_encryption',
			i18nDescription: 'E2E_Enable_description',
			public: true,
			alert: 'E2EE_alert',
		});

		const enable = { _id: 'E2E_Enable', value: true };

		await this.add('E2E_Allow_Unencrypted_Messages', false, {
			type: 'boolean',
			public: true,
			enableQuery: [enable],
		});

		await this.add('E2E_Enabled_Default_DirectRooms', false, {
			type: 'boolean',
			public: true,
			enableQuery: [enable],
		});

		await this.add('E2E_Enabled_Default_PrivateRooms', false, {
			type: 'boolean',
			public: true,
			enableQuery: [enable],
		});

		await this.add('E2E_Enable_Encrypt_Files', true, {
			type: 'boolean',
			public: true,
			enableQuery: [enable],
		});

		await this.add('E2E_Enabled_Mentions', true, {
			type: 'boolean',
			public: true,
			enableQuery: [enable],
		});

		await this.section('Passphrase_Policy', async function () {
			await this.add('E2E_Passphrase_Policy_Enabled', false, {
				type: 'boolean',
				public: true,
				enableQuery: [enable],
			});

			const enabled = {
				_id: 'E2E_Passphrase_Policy_Enabled',
				value: true,
			} satisfies ISettingBase['enableQuery'];

			await this.add('E2E_Passphrase_Policy_MinLength', 7, {
				type: 'int',
				public: true,
				enableQuery: [enabled],
			});

			await this.add('E2E_Passphrase_Policy_MaxLength', -1, {
				type: 'int',
				public: true,
				enableQuery: [enabled],
			});

			await this.add('E2E_Passphrase_Policy_ForbidRepeatingCharacters', true, {
				type: 'boolean',
				public: true,
				enableQuery: [enabled],
			});

			const forbidRepeatingCharacters = {
				_id: 'E2E_Passphrase_Policy_ForbidRepeatingCharacters',
				value: true,
			} satisfies ISettingBase['enableQuery'];

			await this.add('E2E_Passphrase_Policy_ForbidRepeatingCharactersCount', 3, {
				type: 'int',
				public: true,
				enableQuery: [enabled, forbidRepeatingCharacters],
			});

			await this.add('E2E_Passphrase_Policy_AtLeastOneLowercase', true, {
				type: 'boolean',
				public: true,
				enableQuery: [enabled],
			});

			await this.add('E2E_Passphrase_Policy_AtLeastOneUppercase', true, {
				type: 'boolean',
				public: true,
				enableQuery: [enabled],
			});

			await this.add('E2E_Passphrase_Policy_AtLeastOneNumber', true, {
				type: 'boolean',
				public: true,
				enableQuery: [enabled],
			});

			await this.add('E2E_Passphrase_Policy_AtLeastOneSpecialCharacter', true, {
				type: 'boolean',
				public: true,
				enableQuery: [enabled],
			});
		});
	});

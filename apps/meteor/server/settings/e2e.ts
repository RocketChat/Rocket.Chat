import { settingsRegistry } from '.';

export const createE2ESettings = () =>
	settingsRegistry.addGroup('End-to-end_encryption', async function () {
		await this.add('E2E_Enable', false, {
			type: 'boolean',
			i18nLabel: 'End-to-end_encryption',
			i18nDescription: 'E2E_Enable_description',
			public: true,
			alert: 'E2EE_alert',
		});

		await this.add('E2E_Allow_Unencrypted_Messages', false, {
			type: 'boolean',
			public: true,
			enableQuery: { _id: 'E2E_Enable', value: true },
		});

		await this.add('E2E_Enabled_Default_DirectRooms', false, {
			type: 'boolean',
			public: true,
			enableQuery: { _id: 'E2E_Enable', value: true },
		});

		await this.add('E2E_Enabled_Default_PrivateRooms', false, {
			type: 'boolean',
			public: true,
			enableQuery: { _id: 'E2E_Enable', value: true },
		});

		await this.add('E2E_Force_Encryption_For_Private_Rooms', false, {
			type: 'boolean',
			i18nLabel: 'Force_Encryption_For_Private_Rooms',
			i18nDescription: 'Force_Encryption_For_Private_Rooms_Description',
			alert: 'Force_Encryption_For_Private_Rooms_Alert',
			public: true,
			enableQuery: { _id: 'E2E_Enable', value: true },
		});

		await this.add('E2E_Enable_Encrypt_Files', true, {
			type: 'boolean',
			public: true,
			enableQuery: { _id: 'E2E_Enable', value: true },
		});

		await this.add('E2E_Enabled_Mentions', true, {
			type: 'boolean',
			public: true,
			enableQuery: { _id: 'E2E_Enable', value: true },
		});

		await this.add('E2E_Enable_Local_Search', false, {
			type: 'boolean',
			i18nLabel: 'E2E_Enable_Local_Search',
			i18nDescription: 'E2E_Enable_Local_Search_Description',
			public: true,
			enableQuery: { _id: 'E2E_Enable', value: true },
		});

		const localSearchEnableQuery = [
			{ _id: 'E2E_Enable', value: true },
			{ _id: 'E2E_Enable_Local_Search', value: true },
		];

		await this.add('E2E_Local_Search_Backfill_Months', 12, {
			type: 'int',
			i18nLabel: 'E2E_Local_Search_Backfill_Months',
			i18nDescription: 'E2E_Local_Search_Backfill_Months_Description',
			public: true,
			enableQuery: localSearchEnableQuery,
		});

		await this.add('E2E_Local_Search_Backfill_Max_Messages_Per_Room', 0, {
			type: 'int',
			i18nLabel: 'E2E_Local_Search_Backfill_Max_Messages_Per_Room',
			i18nDescription: 'E2E_Local_Search_Backfill_Max_Messages_Per_Room_Description',
			public: true,
			enableQuery: localSearchEnableQuery,
		});

		await this.add('E2E_Local_Search_Backfill_Page_Size', 100, {
			type: 'int',
			i18nLabel: 'E2E_Local_Search_Backfill_Page_Size',
			i18nDescription: 'E2E_Local_Search_Backfill_Page_Size_Description',
			public: true,
			enableQuery: localSearchEnableQuery,
		});

		await this.add('E2E_Local_Search_Backfill_Pause', 12, {
			type: 'int',
			i18nLabel: 'E2E_Local_Search_Backfill_Pause',
			i18nDescription: 'E2E_Local_Search_Backfill_Pause_Description',
			public: true,
			enableQuery: localSearchEnableQuery,
		});

		await this.add('E2E_Local_Search_Backoff_Min', 10, {
			type: 'int',
			i18nLabel: 'E2E_Local_Search_Backoff_Min',
			i18nDescription: 'E2E_Local_Search_Backoff_Min_Description',
			public: true,
			enableQuery: localSearchEnableQuery,
		});

		await this.add('E2E_Local_Search_Backoff_Max', 600, {
			type: 'int',
			i18nLabel: 'E2E_Local_Search_Backoff_Max',
			i18nDescription: 'E2E_Local_Search_Backoff_Max_Description',
			public: true,
			enableQuery: localSearchEnableQuery,
		});
	});

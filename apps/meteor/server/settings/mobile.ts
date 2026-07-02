import { settingsRegistry } from '../../app/settings/server';

export const createMobileSettings = () =>
	settingsRegistry.addGroup('Mobile', async function () {
		await this.add('Allow_Save_Media_to_Gallery', true, {
			type: 'boolean',
			public: true,
		});
		await this.section('Screen_Lock', async function () {
			await this.add('Force_Screen_Lock', false, {
				type: 'boolean',
				i18nDescription: 'Force_Screen_Lock_description',
				public: true,
			});
			await this.add('Force_Screen_Lock_After', 1800, {
				type: 'int',
				i18nDescription: 'Force_Screen_Lock_After_description',
				enableQuery: { _id: 'Force_Screen_Lock', value: true },
				public: true,
			});
		});
		await this.section('Apple_Watch', async function () {
			await this.add('Apple_Watch_Quick_Actions', 'OK,Yes,No,On my way,Will follow up shortly', {
				type: 'string',
				i18nLabel: 'Apple_Watch_Quick_Replies_Default',
				i18nDescription: 'Apple_Watch_Quick_Actions_Description',
				public: true,
			});
		});
	});

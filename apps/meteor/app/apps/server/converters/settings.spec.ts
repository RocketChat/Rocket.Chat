import { SettingType } from '@rocket.chat/apps-engine/definition/settings';
import type { ISetting } from '@rocket.chat/core-typings';

jest.mock('@rocket.chat/models', () => ({
	Settings: {
		findOneById: jest.fn(),
	},
}));

describe('AppSettingsConverter', () => {
	let AppSettingsConverter: any;
	let settingsConverter: any;
	let mockOrchestrator: any;
	let Settings: any;

	beforeAll(async () => {
		const module = await import('./settings');
		AppSettingsConverter = module.AppSettingsConverter;
		const modelsModule = await import('@rocket.chat/models');
		Settings = modelsModule.Settings;
	});

	beforeEach(() => {
		mockOrchestrator = {};
		settingsConverter = new AppSettingsConverter(mockOrchestrator);
		jest.clearAllMocks();
	});

	describe('convertToApp', () => {
		it('should convert a boolean setting to app format', () => {
			const setting: ISetting = {
				_id: 'test-boolean-setting',
				type: 'boolean',
				packageValue: false,
				value: true,
				public: true,
				hidden: false,
				group: 'General',
				i18nLabel: 'Test Boolean Setting',
				i18nDescription: 'A test boolean setting',
				ts: new Date('2024-01-01T00:00:00.000Z'),
				_updatedAt: new Date('2024-01-02T00:00:00.000Z'),
				createdAt: new Date('2024-01-01T00:00:00.000Z'),
			} as ISetting;

			const result = settingsConverter.convertToApp(setting);

			expect(result).toMatchObject({
				id: 'test-boolean-setting',
				type: SettingType.BOOLEAN,
				packageValue: false,
				value: true,
				public: true,
				hidden: false,
				group: 'General',
				i18nLabel: 'Test Boolean Setting',
				i18nDescription: 'A test boolean setting',
				createdAt: new Date('2024-01-01T00:00:00.000Z'),
				updatedAt: new Date('2024-01-02T00:00:00.000Z'),
			});
		});

		it('should convert a string setting to app format', () => {
			const setting: ISetting = {
				_id: 'test-string-setting',
				type: 'string',
				packageValue: 'default',
				value: 'custom',
				public: false,
				hidden: true,
				group: 'Advanced',
				i18nLabel: 'Test String Setting',
				i18nDescription: 'A test string setting',
				ts: new Date('2024-01-01T00:00:00.000Z'),
				_updatedAt: new Date('2024-01-02T00:00:00.000Z'),
				createdAt: new Date('2024-01-01T00:00:00.000Z'),
			} as ISetting;

			const result = settingsConverter.convertToApp(setting);

			expect(result).toMatchObject({
				id: 'test-string-setting',
				type: SettingType.STRING,
				packageValue: 'default',
				value: 'custom',
				public: false,
				hidden: true,
			});
		});

		it('should convert an int setting to NUMBER type', () => {
			const setting: ISetting = {
				_id: 'test-int-setting',
				type: 'int',
				packageValue: 100,
				value: 200,
				public: true,
				hidden: false,
				group: 'Performance',
				i18nLabel: 'Test Int Setting',
				i18nDescription: 'A test integer setting',
				ts: new Date('2024-01-01T00:00:00.000Z'),
				_updatedAt: new Date('2024-01-02T00:00:00.000Z'),
				createdAt: new Date('2024-01-01T00:00:00.000Z'),
			} as ISetting;

			const result = settingsConverter.convertToApp(setting);

			expect(result.type).toBe(SettingType.NUMBER);
		});

		it('should convert a select setting with values', () => {
			const setting: ISetting = {
				_id: 'test-select-setting',
				type: 'select',
				packageValue: 'option1',
				value: 'option2',
				values: [
					{ key: 'option1', i18nLabel: 'Option 1' },
					{ key: 'option2', i18nLabel: 'Option 2' },
				],
				public: true,
				hidden: false,
				group: 'UI',
				i18nLabel: 'Test Select Setting',
				i18nDescription: 'A test select setting',
				ts: new Date('2024-01-01T00:00:00.000Z'),
				_updatedAt: new Date('2024-01-02T00:00:00.000Z'),
				createdAt: new Date('2024-01-01T00:00:00.000Z'),
			} as ISetting;

			const result = settingsConverter.convertToApp(setting);

			expect(result.type).toBe(SettingType.SELECT);
			expect(result.values).toEqual([
				{ key: 'option1', i18nLabel: 'Option 1' },
				{ key: 'option2', i18nLabel: 'Option 2' },
			]);
		});

		it('should convert a code setting to app format', () => {
			const setting: ISetting = {
				_id: 'test-code-setting',
				type: 'code',
				packageValue: 'console.log("default");',
				value: 'console.log("custom");',
				public: false,
				hidden: false,
				group: 'Custom',
				i18nLabel: 'Test Code Setting',
				i18nDescription: 'A test code setting',
				ts: new Date('2024-01-01T00:00:00.000Z'),
				_updatedAt: new Date('2024-01-02T00:00:00.000Z'),
				createdAt: new Date('2024-01-01T00:00:00.000Z'),
			} as ISetting;

			const result = settingsConverter.convertToApp(setting);

			expect(result.type).toBe(SettingType.CODE);
		});

		it('should convert a color setting to app format', () => {
			const setting: ISetting = {
				_id: 'test-color-setting',
				type: 'color',
				packageValue: '#000000',
				value: '#FFFFFF',
				public: true,
				hidden: false,
				group: 'Theme',
				i18nLabel: 'Test Color Setting',
				i18nDescription: 'A test color setting',
				ts: new Date('2024-01-01T00:00:00.000Z'),
				_updatedAt: new Date('2024-01-02T00:00:00.000Z'),
				createdAt: new Date('2024-01-01T00:00:00.000Z'),
			} as ISetting;

			const result = settingsConverter.convertToApp(setting);

			expect(result.type).toBe(SettingType.COLOR);
		});

		it('should convert a font setting to app format', () => {
			const setting: ISetting = {
				_id: 'test-font-setting',
				type: 'font',
				packageValue: 'Arial',
				value: 'Helvetica',
				public: true,
				hidden: false,
				group: 'Theme',
				i18nLabel: 'Test Font Setting',
				i18nDescription: 'A test font setting',
				ts: new Date('2024-01-01T00:00:00.000Z'),
				_updatedAt: new Date('2024-01-02T00:00:00.000Z'),
				createdAt: new Date('2024-01-01T00:00:00.000Z'),
			} as ISetting;

			const result = settingsConverter.convertToApp(setting);

			expect(result.type).toBe(SettingType.FONT);
		});

		it('should pass through unknown types unchanged', () => {
			const setting: ISetting = {
				_id: 'test-unknown-setting',
				type: 'unknown-type' as any,
				packageValue: 'value',
				value: 'value',
				public: true,
				hidden: false,
				group: 'Other',
				i18nLabel: 'Test Unknown Setting',
				i18nDescription: 'A test unknown setting',
				ts: new Date('2024-01-01T00:00:00.000Z'),
				_updatedAt: new Date('2024-01-02T00:00:00.000Z'),
				createdAt: new Date('2024-01-01T00:00:00.000Z'),
			} as ISetting;

			const result = settingsConverter.convertToApp(setting);

			expect(result.type).toBe('unknown-type');
		});
	});

	describe('convertById', () => {
		it('should fetch setting by id and convert it', async () => {
			const mockSetting: ISetting = {
				_id: 'test-setting-by-id',
				type: 'boolean',
				packageValue: false,
				value: true,
				public: true,
				hidden: false,
				group: 'General',
				i18nLabel: 'Test Setting',
				i18nDescription: 'A test setting',
				ts: new Date('2024-01-01T00:00:00.000Z'),
				_updatedAt: new Date('2024-01-02T00:00:00.000Z'),
				createdAt: new Date('2024-01-01T00:00:00.000Z'),
			} as ISetting;

			(Settings.findOneById as jest.Mock).mockResolvedValue(mockSetting);

			const result = await settingsConverter.convertById('test-setting-by-id');

			expect(Settings.findOneById).toHaveBeenCalledWith('test-setting-by-id');
			expect(result).toMatchObject({
				id: 'test-setting-by-id',
				type: SettingType.BOOLEAN,
				value: true,
			});
		});

		it('should handle settings without optional fields', async () => {
			const mockSetting: ISetting = {
				_id: 'minimal-setting',
				type: 'string',
				value: 'test',
				public: false,
				hidden: false,
				ts: new Date('2024-01-01T00:00:00.000Z'),
				_updatedAt: new Date('2024-01-02T00:00:00.000Z'),
				createdAt: new Date('2024-01-01T00:00:00.000Z'),
			} as ISetting;

			(Settings.findOneById as jest.Mock).mockResolvedValue(mockSetting);

			const result = await settingsConverter.convertById('minimal-setting');

			expect(result.id).toBe('minimal-setting');
			expect(result.type).toBe(SettingType.STRING);
		});

		it('should throw an error when setting is not found', async () => {
			(Settings.findOneById as jest.Mock).mockResolvedValue(null);

			await expect(settingsConverter.convertById('non-existent-setting')).rejects.toThrow();
		});
	});
});

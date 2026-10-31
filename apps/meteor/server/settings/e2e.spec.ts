import { createE2ESettings } from './e2e';
import { settingsRegistry } from './index';

jest.mock('./index', () => ({
	settingsRegistry: { addGroup: jest.fn() },
}));

const addGroup = settingsRegistry.addGroup as jest.Mock;

const localSearchSettingIds = [
	'E2E_Enable_Local_Search',
	'E2E_Local_Search_Backfill_Months',
	'E2E_Local_Search_Backfill_Max_Messages_Per_Room',
	'E2E_Local_Search_Backfill_Page_Size',
	'E2E_Local_Search_Backfill_Pause',
	'E2E_Local_Search_Backoff_Min',
	'E2E_Local_Search_Backoff_Max',
];

const expectedDefaults: Record<string, number | boolean> = {
	E2E_Enable_Local_Search: false,
	E2E_Local_Search_Backfill_Months: 12,
	E2E_Local_Search_Backfill_Max_Messages_Per_Room: 0,
	E2E_Local_Search_Backfill_Page_Size: 100,
	E2E_Local_Search_Backfill_Pause: 12,
	E2E_Local_Search_Backoff_Min: 10,
	E2E_Local_Search_Backoff_Max: 600,
};

describe('E2E server settings', () => {
	let registered: Array<{ _id: string; value: number | boolean; options: Record<string, unknown> }>;

	beforeEach(() => {
		registered = [];
		addGroup.mockImplementation(
			async (
				_name: string,
				register: (this: {
					add: (id: string, value: number | boolean, options?: Record<string, unknown>) => Promise<void>;
				}) => Promise<void>,
			) => {
				await register.call({
					add: async (id: string, value: number | boolean, options: Record<string, unknown> = {}) => {
						registered.push({ _id: id, value, options });
					},
				});
			},
		);
	});

	it('registers opt-in local search and all pacing defaults as public settings', async () => {
		await createE2ESettings();

		const localSearchSettings = registered.filter(({ _id }) => localSearchSettingIds.includes(_id));
		expect(localSearchSettings).toHaveLength(7);
		for (const setting of localSearchSettings) {
			expect(setting.value).toBe(expectedDefaults[setting._id]);
			expect(setting.options.public).toBe(true);
		}
	});

	it('enables local search only when E2E is enabled', async () => {
		await createE2ESettings();
		const setting = registered.find(({ _id }) => _id === 'E2E_Enable_Local_Search');
		expect(setting?.options.enableQuery).toEqual({ _id: 'E2E_Enable', value: true });
	});

	it('gates pacing settings on both E2E and local search enablement', async () => {
		await createE2ESettings();
		const expectedEnableQuery = [
			{ _id: 'E2E_Enable', value: true },
			{ _id: 'E2E_Enable_Local_Search', value: true },
		];

		for (const id of localSearchSettingIds.slice(1)) {
			expect(registered.find(({ _id }) => _id === id)?.options.enableQuery).toEqual(expectedEnableQuery);
		}
	});

	it.each(localSearchSettingIds)('registers the expected English label and description for %s', async (id) => {
		await createE2ESettings();
		const setting = registered.find(({ _id }) => _id === id);
		const expectedKeys = { i18nLabel: id, i18nDescription: `${id}_Description` };

		expect(setting?.options).toMatchObject(expectedKeys);

		const locale = await import('../../../../packages/i18n/src/locales/en.i18n.json');
		for (const key of Object.values(expectedKeys)) {
			expect(locale.default).toHaveProperty(key, expect.any(String));
		}
	});
});

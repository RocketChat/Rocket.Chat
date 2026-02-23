/* eslint-disable @typescript-eslint/no-explicit-any */
import { buildVersionUpdateMessage } from './buildVersionUpdateMessage';
import { sendMessagesToAdmins } from '../../../../server/lib/sendMessagesToAdmins';

const originalTestMode = process.env.TEST_MODE;

const mockInfoVersion = jest.fn(() => '7.5.0');

jest.mock('../../../utils/rocketchat.info', () => ({
	Info: {
		get version() {
			return mockInfoVersion();
		},
	},
}));

const mockRemoveBannerById = jest.fn();
const mockFindUsersInRolesWithQuery = jest.fn();

jest.mock('@rocket.chat/models', () => ({
	Settings: {
		updateValueById: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
	},
	Users: {
		findUsersInRolesWithQuery: () => mockFindUsersInRolesWithQuery(),
		removeBannerById: (id: string, bannerId: string) => mockRemoveBannerById(id, bannerId),
	},
}));

const mockSettingsGet = jest.fn();

jest.mock('../../../settings/server', () => ({
	settings: {
		get: (key: string) => mockSettingsGet(key),
	},
}));

jest.mock('../../../../server/lib/i18n', () => ({
	i18n: {
		t: jest.fn((key) => key),
	},
}));

jest.mock('../../../../server/lib/sendMessagesToAdmins', () => ({
	sendMessagesToAdmins: jest.fn(),
}));

jest.mock('../../../../server/settings/lib/auditedSettingUpdates', () => ({
	updateAuditedBySystem: jest.fn(() => () => Promise.resolve({ modifiedCount: 0 })),
}));

jest.mock('../../../lib/server/lib/notifyListener', () => ({
	notifyOnSettingChangedById: jest.fn(),
}));

function createAsyncIterableFromArray(items: unknown[]) {
	let index = 0;
	return {
		[Symbol.asyncIterator]() {
			return {
				async next() {
					if (index < items.length) {
						return { value: items[index++], done: false };
					}
					return { value: undefined, done: true };
				},
			};
		},
	};
}

describe('buildVersionUpdateMessage', () => {
	beforeAll(() => {
		delete process.env.TEST_MODE;
	});

	afterAll(() => {
		process.env.TEST_MODE = originalTestMode;
	});

	beforeEach(() => {
		jest.clearAllMocks();
		mockInfoVersion.mockReturnValue('7.5.0');
		mockSettingsGet.mockReturnValue('7.0.0');
	});

	describe('cleanupOutdatedVersionUpdateBanners', () => {
		it('should remove outdated version banners (<= current installed)', async () => {
			const admin = { _id: 'admin1', banners: { 'versionUpdate-6_2_0': { id: 'versionUpdate-6_2_0' } } };
			mockFindUsersInRolesWithQuery.mockReturnValue(createAsyncIterableFromArray([admin]));

			await buildVersionUpdateMessage([]);

			expect(mockRemoveBannerById).toHaveBeenCalledWith('admin1', 'versionUpdate-6_2_0');
		});

		it('should keep version banners > current installed', async () => {
			const admin = { _id: 'admin1', banners: { 'versionUpdate-8_0_0': { id: 'versionUpdate-8_0_0' } } };
			mockFindUsersInRolesWithQuery.mockReturnValue(createAsyncIterableFromArray([admin]));

			await buildVersionUpdateMessage([]);

			expect(mockRemoveBannerById).not.toHaveBeenCalled();
		});

		it('should remove banners with invalid semver version IDs', async () => {
			const admin = { _id: 'admin1', banners: { 'versionUpdate-invalid_version': { id: 'versionUpdate-invalid_version' } } };
			mockFindUsersInRolesWithQuery.mockReturnValue(createAsyncIterableFromArray([admin]));

			await buildVersionUpdateMessage([]);

			expect(mockRemoveBannerById).toHaveBeenCalledWith('admin1', 'versionUpdate-invalid_version');
		});
	});

	describe('version sorting', () => {
		it('should process versions in descending order (highest first)', async () => {
			mockFindUsersInRolesWithQuery.mockReturnValue(createAsyncIterableFromArray([]));

			await buildVersionUpdateMessage([
				{ version: '7.6.0', security: false, infoUrl: 'https://example.com/7.6.0' },
				{ version: '8.0.0', security: false, infoUrl: 'https://example.com/8.0.0' },
				{ version: '7.8.0', security: false, infoUrl: 'https://example.com/7.8.0' },
			]);

			expect(sendMessagesToAdmins).toHaveBeenCalledTimes(1);
			expect(sendMessagesToAdmins).toHaveBeenCalledWith(
				expect.objectContaining({
					banners: expect.arrayContaining([
						expect.objectContaining({
							id: 'versionUpdate-8_0_0',
						}),
					]),
				}),
			);
		});
	});
});

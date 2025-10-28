import { getUserInfo } from './getUserInfo';
import type { CachedSettings } from '../../../settings/server/CachedSettings';

jest.mock('@rocket.chat/models', () => ({
	Users: {
		findOneById: jest.fn().mockResolvedValue({
			id: '123',
			name: 'Test User',
			emails: [{ address: 'test@example.com' }],
		}),
	},
}));

const settings = new Map<string, unknown>();

jest.mock('../../../settings/server', () => ({
	settings: {
		getByRegexp(_id) {
			return [...settings].filter(([key]) => key.match(_id)) as any;
		},
		get(_id) {
			return settings.get(_id) as any;
		},
		set(record) {
			settings.set(record._id, record.value);
		},
	} satisfies Partial<CachedSettings>,
}));

// @ts-expect-error __meteor_runtime_config__ is not defined in the type definitions
global.__meteor_runtime_config__ = {
	ROOT_URL: 'http://localhost:3000',
	ROOT_URL_PATH_PREFIX: '',
};

describe('getUserInfo', () => {
	let user: Parameters<typeof getUserInfo>[0];

	beforeEach(() => {
		settings.clear();
		settings.set('Site_Url', 'http://localhost:3000');
		user = {
			_id: '123',
			createdAt: new Date(),
			roles: [],
			type: 'user',
			active: true,
			_updatedAt: new Date(),
		};
	});

	it('should return user info', async () => {
		const userInfo = await getUserInfo(user);

		expect(userInfo).toEqual(
			expect.objectContaining({
				_id: '123',
				type: 'user',
				roles: [],
				active: true,
				_updatedAt: expect.any(Date),
				createdAt: expect.any(Date),
				email: undefined,
				avatarUrl: 'http://localhost:3000/avatar/undefined',
				settings: {
					calendar: {},
					profile: {},
					preferences: {},
				},
			}),
		);
	});

	describe('email handling', () => {
		it('should not include email if no emails are present', async () => {
			user.emails = [];
			const userInfo = await getUserInfo(user);
			expect(userInfo.email).toBe(undefined);
		});

		it('should include email if one email is present and verified', async () => {
			user.emails = [{ address: 'test@example.com', verified: true }];
			const userInfo = await getUserInfo(user);
			expect(userInfo.email).toEqual('test@example.com');
		});

		it('should not include email if one email is present and not verified', async () => {
			user.emails = [{ address: 'test@example.com', verified: false }];
			const userInfo = await getUserInfo(user);
			expect(userInfo.email).toBe(undefined);
		});

		it('should include email if multiple emails are present and one is verified', async () => {
			user.emails = [
				{ address: 'test@example.com', verified: false },
				{ address: 'test2@example.com', verified: true },
			];
			const userInfo = await getUserInfo(user);
			expect(userInfo.email).toEqual('test2@example.com');
		});

		it('should not include email if multiple emails are present and none are verified', async () => {
			user.emails = [
				{ address: 'test@example.com', verified: false },
				{ address: 'test2@example.com', verified: false },
			];
			const userInfo = await getUserInfo(user);
			expect(userInfo.email).toBe(undefined);
		});
	});

	describe('outlook calendar settings', () => {
		beforeEach(() => {
			settings.set('Outlook_Calendar_Enabled', true);
			settings.set('Outlook_Calendar_Exchange_Url', 'https://outlook.office365.com/');
			settings.set('Outlook_Calendar_Outlook_Url', 'https://outlook.office365.com/owa/#calendar/view/month');
			settings.set('Outlook_Calendar_Url_Mapping', JSON.stringify({}));
			user.emails = [{ address: 'test@example.com', verified: true }];
		});

		it('should return empty calendar settings if Outlook is disabled', async () => {
			settings.set('Outlook_Calendar_Enabled', false);
			const userInfo = await getUserInfo(user);
			expect(userInfo.settings?.calendar).toEqual({});
		});

		it('should return calendar settings with Outlook enabled and default URLs', async () => {
			const userInfo = await getUserInfo(user);
			expect(userInfo.settings?.calendar?.outlook).toEqual({
				Enabled: true,
				Exchange_Url: 'https://outlook.office365.com/',
				Outlook_Url: 'https://outlook.office365.com/owa/#calendar/view/month',
			});
		});

		it('should return calendar settings with Outlook enabled and domain mapping', async () => {
			settings.set(
				'Outlook_Calendar_Url_Mapping',
				JSON.stringify({
					'example.com': { Exchange_Url: 'https://custom.exchange.com/', Outlook_Url: 'https://custom.outlook.com/' },
				}),
			);
			const userInfo = await getUserInfo(user);
			expect(userInfo.settings?.calendar).toEqual({
				outlook: {
					Enabled: true,
					Exchange_Url: 'https://custom.exchange.com/',
					Outlook_Url: 'https://custom.outlook.com/',
				},
			});
		});

		it('should return calendar settings with outlook disabled but enabled for specific domain', async () => {
			settings.set('Outlook_Calendar_Enabled', false);
			settings.set(
				'Outlook_Calendar_Url_Mapping',
				JSON.stringify({
					'specific.com': { Enabled: true, Exchange_Url: 'https://specific.exchange.com/', Outlook_Url: 'https://specific.outlook.com/' },
				}),
			);
			user.emails = [{ address: 'me@specific.com', verified: true }];
			const userInfo = await getUserInfo(user);
			expect(userInfo.settings?.calendar).toEqual({
				outlook: {
					Enabled: true,
					Exchange_Url: 'https://specific.exchange.com/',
					Outlook_Url: 'https://specific.outlook.com/',
				},
			});
		});

		it('should return calendar settings with Outlook enabled and default mapping for unknown domain', async () => {
			user.emails = [{ address: 'unknown@example.com', verified: true }];
			const userInfo = await getUserInfo(user);
			expect(userInfo.settings?.calendar).toEqual({
				outlook: {
					Enabled: true,
					Exchange_Url: 'https://outlook.office365.com/',
					Outlook_Url: 'https://outlook.office365.com/owa/#calendar/view/month',
				},
			});
		});

		it('should handle invalid JSON in Outlook_Calendar_Url_Mapping', async () => {
			settings.set('Outlook_Calendar_Url_Mapping', 'invalid json');
			const userInfo = await getUserInfo(user);
			expect(userInfo.settings?.calendar).toEqual({
				outlook: {
					Enabled: true,
					Exchange_Url: 'https://outlook.office365.com/',
					Outlook_Url: 'https://outlook.office365.com/owa/#calendar/view/month',
				},
			});
		});
	});
});

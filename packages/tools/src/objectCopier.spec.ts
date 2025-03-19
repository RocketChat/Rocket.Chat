import { type IUserServices, type IUserSettings, type IUser } from '@rocket.chat/core-typings';
import { copyUserBanners, copyUserObject, copyUserServices, copyUserSettings } from './objectCopier';

const USER_BANNERS: IUser['banners'] = {
	banner1: {
		id: 'banner1',
		title: 'Welcome',
		text: 'Welcome to our platform!',
		priority: 1,
		link: '',
		modifiers: ['large'],
	},
	banner2: {
		id: 'banner2',
		title: 'Warning',
		text: 'Your subscription is expiring soon.',
		priority: 2,
		link: '',
		modifiers: ['danger'],
	},
};

const USER_SERVICES: IUserServices = {
	password: {
		bcrypt: '$2a$10$somethinghashed',
	},
	passwordHistory: ['$2a$10$oldhash1', '$2a$10$oldhash2'],
	email: {
		verificationTokens: [{ token: 'randomtoken123', address: 'john@example.com', when: new Date() }],
	},
	cloud: {
		accessToken: 'token',
		refreshToken: 'token2',
		expiresAt: new Date(),
	},
	totp: {
		enabled: true,
		secret: 'totp-secret',
		hashedBackup: ['hashed-backup1', 'hashed-backup2'],
	},
	email2fa: {
		enabled: true,
		changedAt: new Date(),
	},
	emailCode: {
		code: '123456',
		expire: new Date(),
		attempts: 1,
	},
	google: {
		id: 'google-id-12345',
		email: 'john@example.com',
	},
	facebook: {
		id: 'facebook-id-67890',
		email: 'john_fb@example.com',
	},
	github: {
		id: 'github-id-112233',
		email: 'john_github@example.com',
	},
};

const USER_SETTINGS: IUserSettings = {
	profile: {
		name: 'john doe',
	},
	preferences: {
		notifications: 'on',
	},
};

const USER_OBJECT: IUser = {
	_id: '12345',
	username: 'john_doe',
	emails: [{ address: 'john@example.com', verified: true }],
	createdAt: new Date(),
	services: USER_SERVICES,
	settings: USER_SETTINGS,
	roles: ['role1', 'role2'],
	type: 'user',
	active: true,
	_updatedAt: new Date(),
	banners: USER_BANNERS,
};

describe('IUser', () => {
	it('copyUserSettings', () => {
		const copy = copyUserSettings(USER_SETTINGS);
		expect(copy).toEqual(USER_SETTINGS);
	});
	it('copyUserBanners', () => {
		const copy = copyUserBanners(USER_BANNERS);

		expect(copy).toEqual(USER_BANNERS);
	});
	it('copyUserServices', () => {
		const copy = copyUserServices(USER_SERVICES);

		expect(copy).toEqual(USER_SERVICES);
	});
	it('copyUserObject', () => {
		const copy = copyUserObject(USER_OBJECT);

		expect(copy).toEqual(USER_OBJECT);
	});
});

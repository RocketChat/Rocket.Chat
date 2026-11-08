import { isValidAppId } from './isValidAppId';

it.each([
	'ce0e318b-ffc0-4ce4-832b-f1b464beb22a',
	'videoconf-core',
	'media-call-core',
	'cloud-announcements-core',
	'tab_navigation',
	'app-id',
])('accepts %s', (appId) => {
	expect(isValidAppId(appId)).toBe(true);
});

it.each([
	'',
	'.',
	'..',
	'../../v1/users.removeOtherTokens',
	'a/b',
	'a\\b',
	'%2e%2e',
	'app?x=1',
	'app#x',
	' app',
	'app\n',
	undefined,
	null,
	42,
	{ toString: () => 'app' },
])('rejects %p', (appId) => {
	expect(isValidAppId(appId)).toBe(false);
});

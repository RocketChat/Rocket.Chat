import { Settings } from 'meteor/rocketchat:grant';

Settings.add({
	enabled: true,
	provider: 'github',
	key: '96db2753350cfe8c8ae1',
	secret: '546317a561df5e3d350fca9b5500f270b54f3301'
});

Settings.add({
	enabled: true,
	provider: 'facebook',
	key: '494859557516801',
	secret: '5274d3495cebaf01f7e1b90fe1331fba'
});

Settings.add({
	enabled: true,
	provider: 'google',
	key: '979285364697-pob8soqche90ng1af0pj9if6ed69jalh.apps.googleusercontent.com',
	secret: 'lFWtrtJngtlNBdrAoevwPjZh'
});

Settings.apps.add('pwa', {
	redirectUrl: 'http://localhost:4200/login?service={provider}&access_token={accessToken}&refresh_token={refreshToken}',
	errorUrl: 'http://localhost:4200/login?service={provider}&error={error}'
});

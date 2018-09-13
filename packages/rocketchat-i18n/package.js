Package.describe({
	name: 'rocketchat:i18n',
	version: '0.0.1',
	summary: 'RocketChat i18n',
	git: '',
});

Package.onUse(function(api) {
	api.use('templating', 'client');

	const fs = Npm.require('fs');
	const workingDir = process.env.PWD || '.';
	const i18nDir = `${ workingDir }/packages/rocketchat-i18n/i18n`;
	fs.readdirSync(i18nDir).forEach(function(filename) {
		if (filename.indexOf('.json') > -1 && fs.statSync(`${ i18nDir }/${ filename }`).size > 16) {
			api.addFiles(`i18n/${ filename }`);
		}
	});

	const livechatDir = `${ workingDir }/packages/rocketchat-livechat/.app/i18n`;
	fs.readdirSync(livechatDir).forEach(function(filename) {
		if (filename.indexOf('.json') > -1 && fs.statSync(`${ livechatDir }/${ filename }`).size > 16) {
			fs.writeFileSync(`${ i18nDir }/livechat.${ filename }`, fs.readFileSync(`${ livechatDir }/${ filename }`));

			api.addFiles(`i18n/livechat.${ filename }`);
		}
	});

	api.use('tap:i18n@1.8.2');
});

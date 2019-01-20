Package.describe({
	name: 'rocketchat:i18n',
	version: '0.0.1',
	summary: 'RocketChat i18n',
	git: '',
});

const additionalPackages = {
	livechat: 'rocketchat-livechat/.app/i18n',
};

const fs = Npm.require('fs');

Package.onUse(function(api) {
	api.use('templating', 'client');

	const workingDir = process.env.PWD || '.';
	const i18nDir = `${ workingDir }/packages/rocketchat-i18n/i18n`;

	Object.keys(additionalPackages).forEach(function(current) {
		const fullPath = `${ workingDir }/packages/${ additionalPackages[current] }`;
		fs.readdirSync(fullPath).forEach(function(filename) {
			if (filename.indexOf('.json') > -1 && fs.statSync(`${ fullPath }/${ filename }`).size > 16) {
				fs.writeFileSync(`${ i18nDir }/${ current }.${ filename }`, fs.readFileSync(`${ fullPath }/${ filename }`));
			}
		});
	});

	fs.readdirSync(i18nDir).forEach(function(filename) {
		if (filename.indexOf('.json') > -1 && filename.indexOf('livechat.') === -1 && fs.statSync(`${ i18nDir }/${ filename }`).size > 16) {
			api.addFiles(`i18n/${ filename }`);
		}
	});

	api.use('tap:i18n@1.8.2');
});

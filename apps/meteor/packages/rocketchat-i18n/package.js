Package.describe({
	name: 'rocketchat:i18n',
	version: '0.0.1',
	summary: 'RocketChat i18n',
	git: '',
});

const additionalPackages = {};

const fs = Npm.require('fs');

Package.onUse((api) => {
	const workingDir = process.env.PWD || '.';
	const i18nDir = `${workingDir}/packages/rocketchat-i18n/i18n`;

	Object.keys(additionalPackages).forEach((current) => {
		const fullPath = `${workingDir}/packages/${additionalPackages[current]}`;
		fs.readdirSync(fullPath).forEach((filename) => {
			if (filename.indexOf('.json') > -1 && fs.statSync(`${fullPath}/${filename}`).size > 16) {
				fs.writeFileSync(`${i18nDir}/${current}.${filename}`, fs.readFileSync(`${fullPath}/${filename}`));
			}
		});
	});

	fs.readdirSync(i18nDir).forEach((filename) => {
		if (filename.indexOf('.json') > -1 && filename.indexOf('livechat.') === -1 && fs.statSync(`${i18nDir}/${filename}`).size > 16) {
			api.addFiles(`i18n/${filename}`);
		}
	});

	api.use('rocketchat:tap-i18n');
});

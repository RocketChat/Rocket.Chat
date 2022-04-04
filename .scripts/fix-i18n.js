/**
 * This script will:
 *
 * - remove any duplicated i18n key on the same file;
 * - re-order all keys based on source i18n file (en.i18n.json)
 * - remove all keys not present in source i18n file
 */

const fs = require('fs');

const fg = require('fast-glob');

const fixFiles = (path, source, newlineAtEnd = false) => {
	const sourceFile = JSON.parse(fs.readFileSync(`${path}${source}`, 'utf8'));
	const sourceKeys = Object.keys(sourceFile);

	fg([`${path}/**/*.i18n.json`]).then((entries) => {
		entries.forEach((file) => {
			console.log(file);

			const json = JSON.parse(fs.readFileSync(file, 'utf8'));

			fs.writeFileSync(file, `${JSON.stringify(json, sourceKeys, 2)}${newlineAtEnd ? '\n' : ''}`);
		});
	});
};

fixFiles('./packages/rocketchat-i18n', '/i18n/en.i18n.json');

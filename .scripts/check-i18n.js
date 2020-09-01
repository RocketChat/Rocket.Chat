const fs = require('fs');

const fg = require('fast-glob');

const checkFiles = async (path, source) => {
	const sourceFile = JSON.parse(fs.readFileSync(`${ path }${ source }`, 'utf8'));

	const regexVar = /__([a-zA-Z_]+?)__/g;

	const usedKeys = Object.entries(sourceFile)
		.filter(([, value]) => regexVar.exec(value))
		.map(([key, value]) => {
			const replaces = value.match(regexVar);
			return {
				key,
				replaces,
			};
		});

	const validateKeys = (json) =>
		usedKeys
			.filter(({ key }) => typeof json[key] !== 'undefined')
			.reduce((prev, cur) => {
				const { key, replaces } = cur;

				const miss = replaces.filter((replace) => json[key].indexOf(replace) === -1);

				if (miss.length > 0) {
					prev.push({ key, miss });
				}

				return prev;
			}, []);

	const i18nFiles = await fg([`${ path }/**/*.i18n.json`]);

	const result = i18nFiles.filter((file) => {

		const json = JSON.parse(fs.readFileSync(file, 'utf8'));

		const result = validateKeys(json);

		if (result.length === 0) {
			return true;
		}

		console.log('\n## File', file, `(${ result.length } errors)`);

		result.forEach(({ key, miss }) => {
			console.log('\n- Key:', key, '\n  Missing variables:', miss.join(', '));
		});

		return false;
	});

	if (result.length > 0) {
		process.exit(1);
	}

	process.exit(0);
};

checkFiles('./packages/rocketchat-i18n', '/i18n/en.i18n.json');

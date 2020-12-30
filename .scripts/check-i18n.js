const fs = require('fs');

const fg = require('fast-glob');

const regexVar = /__[a-zA-Z_]+__/g;

const validateKeys = (json, usedKeys) =>
	usedKeys
		.filter(({ key }) => typeof json[key] !== 'undefined')
		.reduce((prev, cur) => {
			const { key, replaces } = cur;

			const miss = replaces.filter((replace) => json[key] && json[key].indexOf(replace) === -1);

			if (miss.length > 0) {
				prev.push({ key, miss });
			}

			return prev;
		}, []);

const removeMissingKeys = (i18nFiles, usedKeys) => {
	i18nFiles.forEach((file) => {
		const json = JSON.parse(fs.readFileSync(file, 'utf8'));
		if (Object.keys(json).length === 0) {
			return;
		}

		validateKeys(json, usedKeys)
			.forEach(({ key }) => {
				json[key] = null;
			});

		fs.writeFileSync(file, JSON.stringify(json, null, 2));
	});
};

const checkUniqueKeys = (content, json, filename) => {
	const matchKeys = content.matchAll(/^\s+"([^"]+)"/mg);

	const allKeys = [...matchKeys];

	if (allKeys.length !== Object.keys(json).length) {
		throw new Error(`Duplicated keys found on file ${ filename }`);
	}
};

const validate = (i18nFiles, usedKeys) => {
	const totalErrors = i18nFiles
		.reduce((errors, file) => {
			const content = fs.readFileSync(file, 'utf8');
			const json = JSON.parse(content);

			checkUniqueKeys(content, json, file);

			const result = validateKeys(json, usedKeys);

			if (result.length === 0) {
				return errors;
			}

			console.log('\n## File', file, `(${ result.length } errors)`);

			result.forEach(({ key, miss }) => {
				console.log('\n- Key:', key, '\n  Missing variables:', miss.join(', '));
			});

			return errors + result.length;
		}, 0);

	if (totalErrors > 0) {
		throw new Error(`\n${ totalErrors } errors found`);
	}
};

const checkFiles = async (path, source, fix = false) => {
	const content = fs.readFileSync(`${ path }${ source }`, 'utf8');
	const sourceFile = JSON.parse(content);

	checkUniqueKeys(content, sourceFile, source);

	const usedKeys = Object.entries(sourceFile)
		.map(([key, value]) => {
			const replaces = value.match(regexVar);
			return {
				key,
				replaces,
			};
		});

	const keysWithInterpolation = usedKeys
		.filter(({ replaces }) => !!replaces);

	const i18nFiles = await fg([`${ path }/**/*.i18n.json`]);

	if (fix) {
		return removeMissingKeys(i18nFiles, keysWithInterpolation);
	}

	validate(i18nFiles, keysWithInterpolation);
};

(async () => {
	try {
		await checkFiles('./packages/rocketchat-i18n/i18n/', 'en.i18n.json', process.argv[2] === '--fix');
	} catch (e) {
		console.error(e);
		process.exit(1);
	}
})();

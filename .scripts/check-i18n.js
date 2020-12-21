const fs = require('fs');

const fg = require('fast-glob');

const checkFiles = async (path, source, fix = false) => {
	const sourceFile = JSON.parse(fs.readFileSync(`${ path }${ source }`, 'utf8'));

	const regexVar = /__[a-zA-Z_]+__/g;

	const usedKeys = Object.entries(sourceFile)
		.map(([key, value]) => {
			const replaces = value.match(regexVar);
			return {
				key,
				replaces,
			};
		})
		.filter(({ replaces }) => !!replaces);

	const validateKeys = (json) =>
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

	const i18nFiles = await fg([`${ path }/**/*.i18n.json`]);

	const removeMissingKeys = () => {
		i18nFiles.forEach((file) => {
			const json = JSON.parse(fs.readFileSync(file, 'utf8'));
			if (Object.keys(json).length === 0) {
				return;
			}

			validateKeys(json)
				.forEach(({ key }) => {
					json[key] = null;
				});

			fs.writeFileSync(file, JSON.stringify(json, null, 2));
		});
	};

	const validate = () => {
		let totalErrors = 0;
		i18nFiles.filter((file) => {
			const json = JSON.parse(fs.readFileSync(file, 'utf8'));

			const result = validateKeys(json);

			if (result.length === 0) {
				return true;
			}

			totalErrors += result.length;

			console.log('\n## File', file, `(${ result.length } errors)`);

			result.forEach(({ key, miss }) => {
				console.log('\n- Key:', key, '\n  Missing variables:', miss.join(', '));
			});

			return false;
		});

		if (totalErrors > 0) {
			throw new Error(`\n${ totalErrors } errors found`);
		}
	};

	if (fix) {
		return removeMissingKeys();
	}

	validate();
};

(async () => {
	try {
		await checkFiles('./packages/rocketchat-i18n', '/i18n/en.i18n.json', process.argv[2] === '--fix');
	} catch (e) {
		console.error(e);
		process.exit(1);
	}
})();

const fs = require('fs');

const { parseString, Builder } = require('xml2js');
// const jp = require('@f5io/jsonpath').default;

// const path = '$..path';

const builder = new Builder({
	headless: true,
});

const parse = (str) => new Promise((resolve, reject) => parseString(str, (err, json) => (err ? reject(err) : resolve(json))));

const sort = function (a, b) {
	if (a.toLocaleLowerCase() < b.toLocaleLowerCase()) {
		return -1;
	}
	if (a.toLocaleLowerCase() > b.toLocaleLowerCase()) {
		return 1;
	}
	return 0;
};

const toSymbol = (id, viewBox, { id: _, ...args }) => ({
	symbol: {
		$: {
			id: `icon-${id}`,
			viewBox,
			fill: 'currentColor',
		},
		...args,
	},
});

const xml = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="display: none">';
const start = async () => {
	const stream = fs.createWriteStream('icons.svg', { flags: 'w' });
	stream.write(`${xml}\n`);
	try {
		await new Promise((resolve) => {
			const path = './icons';
			fs.readdir(path, async (err, files) => {
				const promises = files
					.sort(sort)
					.filter((file) => {
						if (!/\.svg/.test(file)) {
							console.log(`invalid extension ${file}`);
							return false;
						}
						return true;
					})
					.map(async (file) => {
						const name = file.replace('.svg', '').toLocaleLowerCase();
						try {
							const content = fs.readFileSync(`${path}/${file}`, 'utf8');
							const { svg } = await parse(content);

							const { $, ...args } = svg;
							const { viewBox } = $;
							stream.write(`${builder.buildObject(toSymbol(name, viewBox, args))}\n`);
						} catch (error) {
							console.log(error);
							return Promise.resolve(error);
						}
					});

				resolve(Promise.all(promises));
			});
		});
	} catch (error) {
		console.error(error);
	} finally {
		stream.write('</svg>');
		stream.end();
	}
};

try {
	start();
} catch (error) {
	console.error(error);
}

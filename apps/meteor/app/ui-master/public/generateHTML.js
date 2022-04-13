const fs = require('fs');

const sort = function (a, b) {
	if (a.toLocaleLowerCase() < b.toLocaleLowerCase()) {
		return -1;
	}
	if (a.toLocaleLowerCase() > b.toLocaleLowerCase()) {
		return 1;
	}
	return 0;
};

const iconHTML = (name) => `<div class="icon" title="${name}"><svg><use href="#icon-${name}"/></svg></div>`;

const header = `<html><body><style>
	* {
		box-sizing: border-box;
	}
	.grid {
		display: grid;
		grid-auto-flow: dense;
		max-width: 380px;
		margin: 0 auto;
		border: 5px solid #ccc;
		grid-template-columns: repeat(auto-fill, 20px);
		grid-gap: 5px;
		background: #ccc;

	}
	.icon {
		background: white;
	}
	svg {
		display: inline-block;
		width: 20px;
		height: 20px;
		color: blue;
}
</style><div class="grid">`;

const start = async () => {
	const html = fs.createWriteStream('icons.html', { flags: 'w' });
	html.write(header);
	try {
		await new Promise((resolve) => {
			fs.readdir('./icons', async (err, files) => {
				files
					.sort(sort)
					.filter((file) => {
						if (!/\.svg/.test(file)) {
							console.log(`invalid extension ${file}`);
							return false;
						}
						return true;
					})
					.forEach(async (file) => {
						const name = file.replace('.svg', '').toLocaleLowerCase();
						console.log(name);
						html.write(iconHTML(name));
					});
				resolve();
			});
		});
	} catch (error) {
		console.error(error);
	} finally {
		html.write(fs.readFileSync('./icons.svg'));
		html.write('</div></body></html>');
		html.end();
	}
};

try {
	start();
} catch (error) {
	console.error(error);
}

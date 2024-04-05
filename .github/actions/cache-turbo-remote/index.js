// list all files that should be sent to remote cache

const { TURBOAPI = process.env.TURBOAPI, TURBOAPIKEY = process.env.TURBOREMOTEAPIKEY } = process.env;

const fs = require('fs');
const FormData = require('form-data');
const files = fs.readdirSync('./node_modules/.cache/turbo');

console.log(`Uploading ${files.length} files to remote cache...`);

const https = require('https');

const updateFile = (path) => {
	new Promise((resolve, reject) => {
		const [hash] = path.split('.');
		console.log(`Uploading  ${path} ${hash}...`);

		let form = new FormData();

		const req = https.request({
			hostname: TURBOAPI,
			path: `/v8/artifacts/${hash}`,
			method: 'PUT',
			headers: {
				...form.getHeaders(),
				authorization: `Bearer ${TURBOAPIKEY}`,
			},
		});

		req.on('error', (e) => {
			console.log(`Error uploading ${file}: ${e}`);
			reject(e);
		});
		req.on('end', () => {
			console.log(`Uploaded ${path}`);
			resolve();
		});

		req.on('finish', () => {
			console.log(`finish Uploaded ${path}`);
			resolve();
		});

		fs.createReadStream(path).pipe(req);
	});
};

files.map(
	(file) =>
		new Promise((resolve, reject) => {
			const path = `./node_modules/.cache/turbo/${file}`;
			updateFile(path);
		}),
);

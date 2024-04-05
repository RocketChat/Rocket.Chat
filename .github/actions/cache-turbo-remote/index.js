// list all files that should be sent to remote cache

const { TURBOAPI = process.env.TURBOAPI, TURBOAPIKEY = process.env.TURBOREMOTEAPIKEY } = process.env;

const fs = require('fs');
const FormData = require('form-data');
const files = fs.readdirSync('./node_modules/.cache/turbo');

const https = require('https');

// send files to remote cache
files.map((file) => {
	new Promise((resolve, reject) => {
		const path = `./node_modules/.cache/turbo/${file}`;

		const [hash] = file.split('.');
		console.log(`Uploading ${hash}...`);

		let form = new FormData();
		form.append('file', fs.createReadStream('./test/payload/id-document.png'));

		https.request(
			{
				hostname: TURBOAPI,
				path: `/v8/artifacts/${hash}`,
				method: 'PUT',
				headers: {
					'Content-Type': 'application/octet-stream',
					'authorization': `Bearer ${TURBOAPIKEY}`,
				},
			},
			(req) => {
				req.on('error', (e) => {
					console.log(`Error uploading ${file}: ${e}`);
					reject(e);
				});
				req.on('end', () => {
					console.log(`Uploaded ${file}`);
					resolve();
				});
			},
		);
	});
});

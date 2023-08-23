import domain from 'domain';
import fs from 'fs';
import stream from 'stream';
import URL from 'url';
import zlib from 'zlib';

import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import mkdirp from 'mkdirp';

import { UploadFS } from './ufs';

Meteor.startup(() => {
	const path = UploadFS.config.tmpDir;
	const mode = UploadFS.config.tmpDirPermissions;

	fs.stat(path, (err) => {
		if (err) {
			// Create the temp directory
			mkdirp(path, { mode })
				.then(() => {
					console.log(`ufs: temp directory created at "${path}"`);
				})
				.catch((err) => {
					console.error(`ufs: cannot create temp directory at "${path}" (${err.message})`);
				});
		} else {
			// Set directory permissions
			fs.chmod(path, mode, (err) => {
				err && console.error(`ufs: cannot set temp directory permissions ${mode} (${err.message})`);
			});
		}
	});
});

// Create domain to handle errors
// and possibly avoid server crashes.
const d = domain.create();

d.on('error', (err) => {
	console.error(`ufs: ${err.message}`);
});

// Listen HTTP requests to serve files
WebApp.connectHandlers.use(async (req, res, next) => {
	// Quick check to see if request should be caught
	if (!req.url?.includes(`/${UploadFS.config.storesPath}/`)) {
		next();
		return;
	}

	// Remove store path
	const parsedUrl = URL.parse(req.url, true);
	const path = parsedUrl.pathname?.substr(UploadFS.config.storesPath.length + 1);

	if (!path) {
		next();
		return;
	}

	const allowCORS = () => {
		// res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
		res.setHeader('Access-Control-Allow-Methods', 'POST');
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
	};

	if (req.method === 'OPTIONS') {
		const regExp = new RegExp('^/([^/?]+)/([^/?]+)$');
		const match = regExp.exec(path);

		// Request is not valid
		if (match === null) {
			res.writeHead(400);
			res.end();
			return;
		}

		// Get store
		const store = UploadFS.getStore(match[1]);
		if (!store) {
			res.writeHead(404);
			res.end();
			return;
		}

		// If a store is found, go ahead and allow the origin
		allowCORS();

		next();
	} else if (req.method === 'POST') {
		res.writeHead(404);
		res.end();
	} else if (req.method === 'GET') {
		// Get store, file Id and file name
		const regExp = new RegExp('^/([^/?]+)/([^/?]+)(?:/([^/?]+))?$');
		const match = regExp.exec(path);

		// Avoid 504 Gateway timeout error
		// if file is not handled by UploadFS.
		if (match === null) {
			next();
			return;
		}

		// Get store
		const storeName = match[1];
		const store = UploadFS.getStore(storeName);

		if (!store) {
			res.writeHead(404);
			res.end();
			return;
		}

		if (store.onRead !== null && store.onRead !== undefined && typeof store.onRead !== 'function') {
			console.error(`ufs: Store.onRead is not a function in store "${storeName}"`);
			res.writeHead(500);
			res.end();
			return;
		}

		// Remove file extension from file Id
		const index = match[2].indexOf('.');
		const fileId = index !== -1 ? match[2].substr(0, index) : match[2];

		// Get file from database
		const file = await store.getCollection().findOne({ _id: fileId });
		if (!file) {
			res.writeHead(404);
			res.end();
			return;
		}

		await d.run(async () => {
			// Check if the file can be accessed
			if ((await store.onRead.call(store, fileId, file, req, res)) !== false) {
				const options: {
					start?: number;
					end?: number;
				} = {};
				let status = 200;

				// Prepare response headers
				const headers: Record<string, any> = {
					'Content-Type': file.type,
					'Content-Length': file.size,
				};

				// Add ETag header
				if (typeof file.etag === 'string') {
					headers.ETag = file.etag;
				}

				// Add Last-Modified header
				if (file.modifiedAt instanceof Date) {
					headers['Last-Modified'] = file.modifiedAt.toUTCString();
				} else if (file.uploadedAt instanceof Date) {
					headers['Last-Modified'] = file.uploadedAt.toUTCString();
				}

				// Parse request headers
				if (typeof req.headers === 'object') {
					// Compare ETag
					if (req.headers['if-none-match']) {
						if (file.etag === req.headers['if-none-match']) {
							res.writeHead(304); // Not Modified
							res.end();
							return;
						}
					}

					// Compare file modification date
					if (req.headers['if-modified-since']) {
						const modifiedSince = new Date(req.headers['if-modified-since']);

						if (
							(file.modifiedAt instanceof Date && file.modifiedAt > modifiedSince) ||
							// eslint-disable-next-line no-mixed-operators
							(file.uploadedAt instanceof Date && file.uploadedAt > modifiedSince)
						) {
							res.writeHead(304); // Not Modified
							res.end();
							return;
						}
					}

					// Support range request
					if (typeof req.headers.range === 'string') {
						const { range } = req.headers;

						// Range is not valid
						if (!range) {
							res.writeHead(416);
							res.end();
							return;
						}

						const total = file.size || 0;
						const unit = range.substr(0, range.indexOf('='));

						if (unit !== 'bytes') {
							res.writeHead(416);
							res.end();
							return;
						}

						const ranges = range
							.substr(unit.length)
							.replace(/[^0-9\-,]/, '')
							.split(',');

						if (ranges.length > 1) {
							// todo: support multipart ranges: https://developer.mozilla.org/en-US/docs/Web/HTTP/Range_requests
						} else {
							const r = ranges[0].split('-');
							const start = parseInt(r[0], 10);
							const end = r[1] ? parseInt(r[1], 10) : total - 1;

							// Range is not valid
							if (start < 0 || end >= total || start > end) {
								res.writeHead(416);
								res.end();
								return;
							}

							// Update headers
							headers['Content-Range'] = `bytes ${start}-${end}/${total}`;
							headers['Content-Length'] = end - start + 1;
							options.start = start;
							options.end = end;
						}
						status = 206; // partial content
					}
				} else {
					headers['Accept-Ranges'] = 'bytes';
				}

				// Open the file stream
				const rs = await store.getReadStream(fileId, file, options);
				const ws = new stream.PassThrough();

				rs.on('error', (err) => {
					store.onReadError.call(store, err, fileId, file);
					res.end();
				});
				ws.on('error', (err) => {
					store.onReadError.call(store, err, fileId, file);
					res.end();
				});
				ws.on('close', () => {
					// Close output stream at the end
					ws.emit('end');
				});

				// Transform stream
				store.transformRead(rs, ws, fileId, file, req, headers);

				// Parse request headers
				if (typeof req.headers === 'object') {
					// Compress data using if needed (ignore audio/video as they are already compressed)
					if (typeof req.headers['accept-encoding'] === 'string' && (!file.type || !/^(audio|video)/.test(file.type))) {
						const accept = req.headers['accept-encoding'];

						// Compress with gzip
						if (accept.match(/\bgzip\b/)) {
							headers['Content-Encoding'] = 'gzip';
							delete headers['Content-Length'];
							res.writeHead(status, headers);
							ws.pipe(zlib.createGzip()).pipe(res);
							return;
						}
						// Compress with deflate
						if (accept.match(/\bdeflate\b/)) {
							headers['Content-Encoding'] = 'deflate';
							delete headers['Content-Length'];
							res.writeHead(status, headers);
							ws.pipe(zlib.createDeflate()).pipe(res);
							return;
						}
					}
				}

				// Send raw data
				if (!headers['Content-Encoding']) {
					res.writeHead(status, headers);
					ws.pipe(res);
				}
			} else {
				res.end();
			}
		});
	} else {
		next();
	}
});

/* eslint-disable no-undef */
/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 Karl STEIN
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */
import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
// eslint-disable-next-line import/no-unresolved
import SparkMD5 from 'spark-md5';

import { UploadFS } from './ufs';

if (Meteor.isServer) {
	const domain = Npm.require('domain');
	const fs = Npm.require('fs');
	// eslint-disable-next-line no-unused-vars
	const http = Npm.require('http');
	// eslint-disable-next-line no-unused-vars
	const https = Npm.require('https');
	const mkdirp = Npm.require('mkdirp');
	const stream = Npm.require('stream');
	const URL = Npm.require('url');
	const zlib = Npm.require('zlib');

	Meteor.startup(() => {
		const path = UploadFS.config.tmpDir;
		const mode = UploadFS.config.tmpDirPermissions;

		fs.stat(path, (err) => {
			if (err) {
				// Create the temp directory
				mkdirp(path, { mode }, (err) => {
					if (err) {
						console.error(`ufs: cannot create temp directory at "${path}" (${err.message})`);
					} else {
						console.log(`ufs: temp directory created at "${path}"`);
					}
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
	WebApp.connectHandlers.use((req, res, next) => {
		// Quick check to see if request should be caught
		if (!req.url.includes(`/${UploadFS.config.storesPath}/`)) {
			next();
			return;
		}

		// Remove store path
		const parsedUrl = URL.parse(req.url);
		const path = parsedUrl.pathname.substr(UploadFS.config.storesPath.length + 1);

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
			// Get store
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

			// Get file
			const fileId = match[2];
			if (store.getCollection().find({ _id: fileId }).count() === 0) {
				res.writeHead(404);
				res.end();
				return;
			}

			// Check upload token
			if (!store.checkToken(req.query.token, fileId)) {
				res.writeHead(403);
				res.end();
				return;
			}

			// Check if duplicate
			const unique = function (hash) {
				const originalId = store.getCollection().findOne({ hash, _id: { $ne: fileId } });
				return originalId ? originalId._id : false;
			};

			const spark = new SparkMD5.ArrayBuffer();
			const tmpFile = UploadFS.getTempFilePath(fileId);
			const ws = fs.createWriteStream(tmpFile, { flags: 'a' });
			const fields = { uploading: true };
			const progress = parseFloat(req.query.progress);
			if (!isNaN(progress) && progress > 0) {
				fields.progress = Math.min(progress, 1);
			}

			req.on('data', (chunk) => {
				ws.write(chunk);
				spark.append(chunk);
			});
			// eslint-disable-next-line no-unused-vars
			req.on('error', (err) => {
				res.writeHead(500);
				res.end();
			});
			req.on(
				'end',
				Meteor.bindEnvironment(() => {
					// Update completed state without triggering hooks
					fields.hash = spark.end();
					fields.originalId = unique(fields.hash);
					store.getCollection().direct.update({ _id: fileId }, { $set: fields });
					ws.end();
				}),
			);
			ws.on('error', (err) => {
				console.error(`ufs: cannot write chunk of file "${fileId}" (${err.message})`);
				fs.unlink(tmpFile, (err) => {
					err && console.error(`ufs: cannot delete temp file "${tmpFile}" (${err.message})`);
				});
				res.writeHead(500);
				res.end();
			});
			ws.on('finish', () => {
				res.writeHead(204, { 'Content-Type': 'text/plain' });
				res.end();
			});
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
			const file = store.getCollection().findOne({ _id: fileId });
			if (!file) {
				res.writeHead(404);
				res.end();
				return;
			}

			// Simulate read speed
			if (UploadFS.config.simulateReadDelay) {
				Meteor._sleepForMs(UploadFS.config.simulateReadDelay);
			}

			d.run(() => {
				// Check if the file can be accessed
				if (store.onRead.call(store, fileId, file, req, res) !== false) {
					const options = {};
					let status = 200;

					// Prepare response headers
					const headers = {
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

							const total = file.size;
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
					const rs = store.getReadStream(fileId, file, options);
					const ws = new stream.PassThrough();

					rs.on(
						'error',
						Meteor.bindEnvironment((err) => {
							store.onReadError.call(store, err, fileId, file);
							res.end();
						}),
					);
					ws.on(
						'error',
						Meteor.bindEnvironment((err) => {
							store.onReadError.call(store, err, fileId, file);
							res.end();
						}),
					);
					ws.on('close', () => {
						// Close output stream at the end
						ws.emit('end');
					});

					// Transform stream
					store.transformRead(rs, ws, fileId, file, req, headers);

					// Parse request headers
					if (typeof req.headers === 'object') {
						// Compress data using if needed (ignore audio/video as they are already compressed)
						if (typeof req.headers['accept-encoding'] === 'string' && !/^(audio|video)/.test(file.type)) {
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
}

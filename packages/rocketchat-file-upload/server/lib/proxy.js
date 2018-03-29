/* globals UploadFS, InstanceStatus */

import http from 'http';
import URL from 'url';

const logger = new Logger('UploadProxy');

WebApp.connectHandlers.stack.unshift({
	route: '',
	handle: Meteor.bindEnvironment(function(req, res, next) {
		// Quick check to see if request should be catch
		if (req.url.indexOf(UploadFS.config.storesPath) === -1) {
			return next();
		}

		logger.debug('Upload URL:', req.url);

		if (req.method !== 'POST') {
			return next();
		}

		// Remove store path
		const parsedUrl = URL.parse(req.url);
		const path = parsedUrl.pathname.substr(UploadFS.config.storesPath.length + 1);

		// Get store
		const regExp = new RegExp('^\/([^\/\?]+)\/([^\/\?]+)$');
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

		// Get file
		const fileId = match[2];
		const file = store.getCollection().findOne({_id: fileId});
		if (file === undefined) {
			res.writeHead(404);
			res.end();
			return;
		}

		if (file.instanceId === InstanceStatus.id()) {
			logger.debug('Correct instance');
			return next();
		}

		// Proxy to other instance
		const instance = InstanceStatus.getCollection().findOne({_id: file.instanceId});

		if (instance == null) {
			res.writeHead(404);
			res.end();
			return;
		}

		if (instance.extraInformation.host === process.env.INSTANCE_IP && RocketChat.isDocker() === false) {
			instance.extraInformation.host = 'localhost';
		}

		logger.debug('Wrong instance, proxing to:', `${ instance.extraInformation.host }:${ instance.extraInformation.port }`);

		const options = {
			hostname: instance.extraInformation.host,
			port: instance.extraInformation.port,
			path: req.originalUrl,
			method: 'POST'
		};

		const proxy = http.request(options, function(proxy_res) {
			proxy_res.pipe(res, {
				end: true
			});
		});

		req.pipe(proxy, {
			end: true
		});
	})
});

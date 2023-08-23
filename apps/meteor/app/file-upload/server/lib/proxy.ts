import http from 'http';
import URL from 'url';

import { InstanceStatus } from '@rocket.chat/instance-status';
import { Logger } from '@rocket.chat/logger';
import { InstanceStatus as InstanceStatusModel } from '@rocket.chat/models';
import type { NextFunction } from 'connect';
import type createServer from 'connect';
import { WebApp } from 'meteor/webapp';

import { UploadFS } from '../../../../server/ufs';
import { isDocker } from '../../../utils/server/functions/isDocker';

const logger = new Logger('UploadProxy');

async function handle(req: createServer.IncomingMessage, res: http.ServerResponse, next: NextFunction) {
	// Quick check to see if request should be catch
	if (!req.url?.includes(`/${UploadFS.config.storesPath}/`)) {
		return next();
	}

	logger.debug({ msg: 'Upload URL:', url: req.url });

	if (req.method !== 'POST') {
		return next();
	}

	// Remove store path
	const parsedUrl = URL.parse(req.url);
	const path = parsedUrl.pathname?.substr(UploadFS.config.storesPath.length + 1) || '';

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

	// Get file
	const fileId = match[2];
	const file = await store.getCollection().findOne({ _id: fileId });
	if (!file) {
		res.writeHead(404);
		res.end();
		return;
	}

	if (!file.instanceId || file.instanceId === InstanceStatus.id()) {
		logger.debug('Correct instance');
		return next();
	}

	// Proxy to other instance
	const instance = await InstanceStatusModel.findOneById(file.instanceId);

	if (instance == null) {
		res.writeHead(404);
		res.end();
		return;
	}

	if (instance.extraInformation.host === process.env.INSTANCE_IP && isDocker() === false) {
		instance.extraInformation.host = 'localhost';
	}

	logger.debug(`Wrong instance, proxing to ${instance.extraInformation.host}:${instance.extraInformation.port}`);

	const options = {
		hostname: instance.extraInformation.host,
		port: instance.extraInformation.port,
		path: req.originalUrl,
		method: 'POST',
	};

	logger.warn(
		'UFS proxy middleware is deprecated as this upload method is not being used by Web/Mobile Clients. See this: https://docs.rocket.chat/api/rest-api/methods/rooms/upload',
	);
	// eslint-disable-next-line @typescript-eslint/naming-convention
	const proxy = http.request(options, (proxy_res) => {
		proxy_res.pipe(res, {
			end: true,
		});
	});

	req.pipe(proxy, {
		end: true,
	});
}

WebApp.connectHandlers.stack.unshift({
	route: '',
	// eslint-disable-next-line @typescript-eslint/no-misused-promises
	handle,
});

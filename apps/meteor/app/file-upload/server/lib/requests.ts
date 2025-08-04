import type { IncomingMessage } from 'http';

import { Uploads } from '@rocket.chat/models';
import { WebApp } from 'meteor/webapp';

import { FileUpload } from './FileUpload';

const hasInfoParam = (req: IncomingMessage) => {
	if (!req.url) {
		return false;
	}
	const [, params] = req.url.split('?');
	if (!params) {
		return false;
	}
	const searchParams = new URLSearchParams(params);
	const infoParam = searchParams.get('info');
	return infoParam === 'true' || infoParam === '1';
};

WebApp.connectHandlers.use(FileUpload.getPath(), async (req, res, next) => {
	const match = /^\/([^\/]+)\/(.*)/.exec(req.url || '');

	if (match?.[1]) {
		const file = await Uploads.findOneById(match[1]);

		if (file) {
			if (!(await FileUpload.requestCanAccessFiles(req, file))) {
				res.writeHead(403);
				res.end();
				return;
			}

			if (hasInfoParam(req)) {
				if (!file.store) {
					res.writeHead(404);
					res.end();
					return;
				}
				const store = FileUpload.getStoreByName(file.store);
				let url: string | false;
				try {
					url = await store.getStore().getRedirectURL(file, false);
				} catch {
					url = false;
				}
				const expiryTimespan = await store.getStore().getUrlExpiryTimeSpan();
				return FileUpload.respondWithRedirectUrlInfo(url, file, req, res, expiryTimespan);
			}

			res.setHeader('Content-Security-Policy', "default-src 'none'");
			res.setHeader('Cache-Control', 'max-age=31536000');
			await FileUpload.get(file, req, res, next);
			return;
		}
	}

	res.writeHead(404);
	res.end();
});

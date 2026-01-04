import type { IncomingMessage } from 'http';

import { Uploads } from '@rocket.chat/models';
import { WebApp } from 'meteor/webapp';

import { FileUpload } from './FileUpload';
import { SystemLogger } from '../../../../server/lib/logger/system';

const hasReplyWithRedirectUrlParam = (req: IncomingMessage) => {
	if (!req.url) {
		return false;
	}
	const [, params] = req.url.split('?');
	if (!params) {
		return false;
	}
	const searchParams = new URLSearchParams(params);
	const replyWithRedirectUrl = searchParams.get('replyWithRedirectUrl');
	return replyWithRedirectUrl === 'true' || replyWithRedirectUrl === '1';
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

			if (hasReplyWithRedirectUrlParam(req)) {
				if (!file.store) {
					res.writeHead(404);
					res.end();
					return;
				}
				const store = FileUpload.getStoreByName(file.store);
				let url: string | false = false;
				let expiryTimespan: number | null = null;
				try {
					url = await store.getStore().getRedirectURL(file, false);
					expiryTimespan = await store.getStore().getUrlExpiryTimeSpan();
				} catch (e) {
					SystemLogger.debug(e);
				}
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

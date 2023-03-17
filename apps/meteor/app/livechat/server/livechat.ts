import url from 'url';
import type { IncomingMessage, ServerResponse } from 'http';

import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import type { NextFunction } from 'connect';

import { settings } from '../../settings/server';
import { addServerUrlToIndex } from '../lib/Assets';

const indexHtmlWithServerURL = addServerUrlToIndex(Assets.getText('livechat/index.html') || '');

settings.watch('Livechat_widget_enabled', (enabled) => {
	if (enabled) {
		WebApp.connectHandlers.use(
			'/livechat',
			Meteor.bindEnvironment((req: IncomingMessage, res: ServerResponse, next: NextFunction) => {
				if (!req.url) {
					return next();
				}

				const reqUrl = url.parse(req.url);
				if (reqUrl.pathname !== '/') {
					return next();
				}

				res.setHeader('content-type', 'text/html; charset=utf-8');

				const domainWhiteListSetting = settings.get<string>('Livechat_AllowedDomainsList');
				let domainWhiteList = [];
				if (req.headers.referer && !domainWhiteListSetting.trim()) {
					domainWhiteList = domainWhiteListSetting.split(',').map((domain) => domain.trim());

					const referer = url.parse(req.headers.referer);
					if (referer.host && !domainWhiteList.includes(referer.host)) {
						res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");
						return next();
					}

					res.setHeader('Content-Security-Policy', `frame-ancestors ${referer.protocol}//${referer.host}`);
				} else {
					// TODO need to remove inline scripts from this route to be able to enable CSP here as well
					res.removeHeader('Content-Security-Policy');
				}

				res.write(indexHtmlWithServerURL);
				res.end();
			}),
		);
	}
});

import url from 'url';

import jsdom from 'jsdom';
import mem from 'mem';
import { WebApp } from 'meteor/webapp';

import { settings } from '../../settings/server';
import { addServerUrlToIndex } from '../lib/Assets';

const indexHtmlWithServerURL = addServerUrlToIndex((await Assets.getText('livechat/index.html')) || '');

function parseExtraAttributes(widgetData: string): string {
	const liveChatAdditionalScripts = settings.get<string>('Livechat_AdditionalWidgetScripts');
	const additionalClass = settings.get<string>('Livechat_WidgetLayoutClasses');

	if (liveChatAdditionalScripts == null || additionalClass == null) {
		return widgetData;
	}

	const domParser = new jsdom.JSDOM(widgetData);
	const doc = domParser.window.document;
	const head = doc.querySelector('head');
	const body = doc.querySelector('body');

	liveChatAdditionalScripts.split(',').forEach((script) => {
		const scriptElement = doc.createElement('script');
		scriptElement.src = script;
		body?.appendChild(scriptElement);
	});

	additionalClass.split(',').forEach((css) => {
		const linkElement = doc.createElement('link');
		linkElement.rel = 'stylesheet';
		linkElement.href = css;
		head?.appendChild(linkElement);
	});

	return doc.documentElement.innerHTML;
}

const memoizedParseExtraAttributes = mem(parseExtraAttributes, { maxAge: process.env.TEST_MODE === 'true' ? 1 : 60000 });

WebApp.connectHandlers.use('/livechat', (req, res, next) => {
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
	if (req.headers.referer && domainWhiteListSetting.trim()) {
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

	res.write(memoizedParseExtraAttributes(indexHtmlWithServerURL));
	res.end();
});

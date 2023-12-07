import url from 'url';
import { WebApp } from 'meteor/webapp';
import { settings } from '../../settings/server';
import { addServerUrlToIndex } from '../lib/Assets';

let indexHtmlWithServerURL = addServerUrlToIndex((await Assets.getTextAsync('livechat/index.html')) || '');

const jsdom = require("jsdom");
const domParser = new jsdom.JSDOM(indexHtmlWithServerURL);
const doc = domParser.window.document;
const head = doc.querySelector("head");
const body = doc.querySelector("body");

const liveChatAdditionalScripts = settings.get<string>('Livechat_AdditionalWidgetScripts');
console.debug("CC-11 liveChatAdditionalScripts is " + liveChatAdditionalScripts);
if (liveChatAdditionalScripts) {
	liveChatAdditionalScripts.split(',').forEach((script) => {
		const scriptElement = doc.createElement('script');
		scriptElement.src = script;
		console.debug("CC-11 script src " + scriptElement.src);
		head?.appendChild(scriptElement);
		body?.appendChild(scriptElement);
	});
}
const additionalClass = settings.get<string>('Livechat_WidgetLayoutClasses');
console.debug("CC-11 Livechat_WidgetLayoutClasses is " + additionalClass);
if (additionalClass) {
	additionalClass.split(',').forEach((css) => {
		const linkElement = doc.createElement('link');
		linkElement.rel="stylesheet";
		linkElement.href = css;
		console.debug("CC-11 linkElement.href is " + css);
		head.appendChild(linkElement);
		console.debug("CC-11 added " + css + "to " + head)
	});
}

indexHtmlWithServerURL = doc.documentElement.innerHTML;

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

	res.write(indexHtmlWithServerURL);
	res.end();

});

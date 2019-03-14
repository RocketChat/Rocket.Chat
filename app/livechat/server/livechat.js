import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { settings } from '/app/settings';
import { addServerUrlToIndex, addServerUrlToHead } from '../lib/Assets';
import _ from 'underscore';
import url from 'url';

const latestVersion = '1.0';
const indexHtmlWithServerURL = addServerUrlToIndex(Assets.getText('livechat/index.html'));
const headHtmlWithServerURL = addServerUrlToHead(Assets.getText('livechat/head.html'));
const isLatestVersion = (version) => version && version === latestVersion;

WebApp.connectHandlers.use('/livechat', Meteor.bindEnvironment((req, res, next) => {
	const reqUrl = url.parse(req.url);
	if (reqUrl.pathname !== '/') {
		return next();
	}

	const { version } = req.query;
	const html = isLatestVersion(version) ? indexHtmlWithServerURL : headHtmlWithServerURL;

	res.setHeader('content-type', 'text/html; charset=utf-8');

	let domainWhiteList = settings.get('Livechat_AllowedDomainsList');
	if (req.headers.referer && !_.isEmpty(domainWhiteList.trim())) {
		domainWhiteList = _.map(domainWhiteList.split(','), function(domain) {
			return domain.trim();
		});

		const referer = url.parse(req.headers.referer);
		if (!_.contains(domainWhiteList, referer.host)) {
			res.setHeader('X-FRAME-OPTIONS', 'DENY');
			return next();
		}

		res.setHeader('X-FRAME-OPTIONS', `ALLOW-FROM ${ referer.protocol }//${ referer.host }`);
	}

	res.write(html);
	res.end();
}));

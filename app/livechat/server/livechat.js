import url from 'url';

import _ from 'underscore';
import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';

import { settings } from '../../settings/server';
import { addServerUrlToIndex, addCobrowseLicenseKey } from '../lib/Assets';

const indexHtmlWithServerURL = addServerUrlToIndex(Assets.getText('livechat/index.html'));

WebApp.connectHandlers.use('/livechat', Meteor.bindEnvironment((req, res, next) => {
	const reqUrl = url.parse(req.url);
	if (reqUrl.pathname !== '/') {
		return next();
	}


	res.setHeader('content-type', 'text/html; charset=utf-8');

	let domainWhiteList = settings.get('Livechat_AllowedDomainsList');
	if (req.headers.referer && !_.isEmpty(domainWhiteList.trim())) {
		domainWhiteList = _.map(domainWhiteList.split(','), function(domain) {
			return domain.trim();
		});

		const referer = url.parse(req.headers.referer);
		if (!_.contains(domainWhiteList, referer.host)) {
			res.setHeader('Content-Security-Policy', 'frame-ancestors \'none\'');
			return next();
		}

		res.setHeader('Content-Security-Policy', `frame-ancestors ${ referer.protocol }//${ referer.host }`);
	}

	res.write(indexHtmlWithServerURL);
	res.end();
}));

settings.get('Livechat_screen_sharing_provider', function(_key, value) {
	if (!value) {
		return;
	}

	value = value.toString();
	let screenSharingProvider = '';

	if (value === 'Cobrowse.io') {
		screenSharingProvider = 'cobrowse';
	}

	if (screenSharingProvider === '') {
		return;
	}

	let screenSharingProviderTxt = Assets.getText(`livechat/screen-sharing/${ screenSharingProvider }.txt`);

	if (screenSharingProvider === 'cobrowse') {
		const license_key = settings.get('Cobrowse.io_License_Key');
		screenSharingProviderTxt = addCobrowseLicenseKey(screenSharingProviderTxt, license_key);
	}

	WebApp.connectHandlers.use(`/livechat/screen-sharing/${ screenSharingProvider }.js`, Meteor.bindEnvironment((req, res, next) => {
		const reqUrl = url.parse(req.url);
		console.log(reqUrl);
		if (reqUrl.pathname !== '/') {
			return next();
		}

		res.setHeader('content-type', 'application/javascript; charset=utf-8');

		let domainWhiteList = settings.get('Livechat_AllowedDomainsList');
		if (req.headers.referer && !_.isEmpty(domainWhiteList.trim())) {
			domainWhiteList = _.map(domainWhiteList.split(','), function(domain) {
				return domain.trim();
			});

			const referer = url.parse(req.headers.referer);
			if (!_.contains(domainWhiteList, referer.host)) {
				res.setHeader('Content-Security-Policy', 'frame-ancestors \'none\'');
				return next();
			}

			res.setHeader('Content-Security-Policy', `frame-ancestors ${ referer.protocol }//${ referer.host }`);
		}

		res.write(screenSharingProviderTxt);
		res.end();
	}));
});

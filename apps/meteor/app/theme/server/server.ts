import crypto from 'crypto';

import { WebApp } from 'meteor/webapp';

import { settings } from '../../settings/server';
import { addStyle } from '../../ui-master/server/inject';

settings.watch('theme-custom-css', (value) => {
	if (!value || typeof value !== 'string') {
		addStyle('theme-custom-css', '');
		return;
	}
	addStyle('css-theme', value);
});

WebApp.rawConnectHandlers.use((req, res, next) => {
	const path = req.url?.split('?')[0];
	const prefix = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '';

	if (path !== `${prefix}/theme.css`) {
		next();
		return;
	}

	const style = settings.get('theme-custom-css');

	if (!style || typeof style !== 'string') {
		throw new Error('Invalid theme-custom-css setting');
	}

	res.setHeader('Content-Type', 'text/css; charset=UTF-8');
	res.setHeader('Content-Length', style.length);
	res.setHeader('ETag', `"${crypto.createHash('sha1').update(style).digest('hex')}"`);
	res.end(style, 'utf-8');
});

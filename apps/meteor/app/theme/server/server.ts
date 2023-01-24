import crypto from 'crypto';

import { Meteor } from 'meteor/meteor';
import { Settings } from '@rocket.chat/models';
import { WebApp } from 'meteor/webapp';

import { settings } from '../../settings/server';
import { addStyle } from '../../ui-master/server/inject';

settings.watch('theme-custom-css', (value) => {
	if (!value || typeof value !== 'string') {
		addStyle('css-theme', '');
		return;
	}
	addStyle('css-theme', value);
});

// TODO: Add a migration to remove this setting from the database
Meteor.startup(() => {
	Settings.deleteMany({ _id: /theme-color/ });
	Settings.deleteOne({ _id: /theme-font/ });
	Settings.deleteOne({ _id: 'css' });
});

WebApp.rawConnectHandlers.use((req, res, next) => {
	const path = req.url?.split('?')[0];
	const prefix = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '';

	if (path !== `${prefix}/theme.css`) {
		next();
		return;
	}

	const style = settings.get('theme-custom-css');
	if (typeof style !== 'string') {
		throw new Error('Invalid theme-custom-css setting');
	}

	res.setHeader('Content-Type', 'text/css; charset=UTF-8');
	res.setHeader('Content-Length', style.length);
	res.setHeader('ETag', `"${crypto.createHash('sha1').update(style).digest('hex')}"`);
	res.end(style, 'utf-8');
});

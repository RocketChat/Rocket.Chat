import crypto from 'node:crypto';

import { Settings } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { settings } from '..';
import { httpApp } from '../../lib/http/httpServer';
import { addStyle } from '../../lib/ui-master/inject';

settings.watch('theme-custom-css', (value) => {
	if (!value || typeof value !== 'string') {
		addStyle('css-theme', '');
		return;
	}
	addStyle('css-theme', value);
});

// TODO: Add a migration to remove this setting from the database
Meteor.startup(async () => {
	await Settings.deleteMany({ _id: /theme-color/ });
	await Settings.deleteOne({ _id: /theme-font/ });
	await Settings.deleteOne({ _id: 'css' });
});

httpApp.use(async (c, next) => {
	const prefix = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '';

	if (c.req.path !== `${prefix}/theme.css`) {
		return next();
	}

	const style = settings.get('theme-custom-css');
	if (typeof style !== 'string') {
		throw new Error('Invalid theme-custom-css setting');
	}

	return c.body(style, 200, {
		'Content-Type': 'text/css; charset=UTF-8',
		'ETag': `"${crypto.createHash('sha1').update(style).digest('hex')}"`,
	});
});

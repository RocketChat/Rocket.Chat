import crypto from 'crypto';

import { WebApp } from 'meteor/webapp';

import { settings } from '../../settings/server';
import { Logger } from '../../logger/server';
import { addStyle } from '../../ui-master/server/inject';
import { Theme } from './Theme';

const logger = new Logger('rocketchat:theme');

export const theme = new Theme({ logger });

settings.watch('css', () => {
	addStyle('css-theme', theme.getCss());
	process.emit('message', { refresh: 'client' });
});

WebApp.rawConnectHandlers.use((req, res, next) => {
	const path = req.url?.split('?')[0];
	const prefix = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '';

	if (path !== `${prefix}/theme.css`) {
		next();
		return;
	}

	const data = theme.getCss();

	res.setHeader('Content-Type', 'text/css; charset=UTF-8');
	res.setHeader('Content-Length', data.length);
	res.setHeader('ETag', `"${crypto.createHash('sha1').update(data).digest('hex')}"`);
	res.end(data, 'utf-8');
});

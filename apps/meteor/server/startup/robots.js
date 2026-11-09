import { WebApp } from 'meteor/webapp';

import { settings } from '../settings';

WebApp.connectHandlers.use('/robots.txt', (req, res /* , next*/) => {
	res.writeHead(200);
	res.end(settings.get('Robot_Instructions_File_Content'));
});

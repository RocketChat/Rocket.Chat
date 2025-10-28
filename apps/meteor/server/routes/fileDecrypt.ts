import { WebApp } from 'meteor/webapp';

WebApp.connectHandlers.use('/file-decrypt/', (_, res) => {
	// returns 404
	res.writeHead(404);
	res.end('Not found');
});

import { WebApp } from 'meteor/webapp';

import { attachSocketForensics, patchSocketDestroy } from '../lib/socketForensics';

if (process.env.SOCKET_FORENSICS === 'true') {
	attachSocketForensics(WebApp.httpServer);
	patchSocketDestroy();
}

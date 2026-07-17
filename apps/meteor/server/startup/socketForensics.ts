import { WebApp } from 'meteor/webapp';

import { attachSocketForensics, patchSocketDestroy, patchSocketEnd } from '../lib/socketForensics';

if (process.env.SOCKET_FORENSICS === 'true') {
	attachSocketForensics(WebApp.httpServer);
	patchSocketDestroy();
	patchSocketEnd();
}

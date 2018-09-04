import express from 'express';
import bodyParser from 'body-parser';

import messagesRoutes from './routes/messages';
import usersRoutes from './routes/users';

const app = express();
app.use(bodyParser.json());

class PeerServer {
	constructor(config) {
		// General
		this.config = config;
	}

	start() {
		const { identifier, server: { port } } = this.config;

		// Setup routes
		messagesRoutes.call(this, app);
		usersRoutes.call(this, app);

		// Start listening
		app.listen(port, () => console.log(`[federation] ${ identifier }'s server is listening on ${ port }`));
	}
}

export default PeerServer;

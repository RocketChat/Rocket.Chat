import express from 'express';
import bodyParser from 'body-parser';

import messagesRoutes from './routes/messages';
import usersRoutes from './routes/users';

const app = express();
app.use(bodyParser.json());

const router = express.Router(); /* eslint-disable-line new-cap */

messagesRoutes(router);
usersRoutes(router);

app.use('/', router);

function startPeer(config) {
	const {
		peer: { port },
	} = config;

	app.listen(port, () => console.log(`Federation peer - running @ ${ port }`));
}

export default startPeer;

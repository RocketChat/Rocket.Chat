import express from 'express';
import { upsertLocalPeerUsers } from '../../utils';

const router = express.Router(); /* eslint-disable-line new-cap */

export default function usersRoutes(app) {
	app.use('/users', router);

	router.put('/', async function(req, res) {
		const {
			body: { users },
		} = req;

		upsertLocalPeerUsers(users);

		res.sendStatus(200);
	});
}

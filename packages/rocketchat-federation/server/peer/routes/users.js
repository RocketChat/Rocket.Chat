import { upsertLocalUsers, upsertLocalUser } from '../../utils';

function usersRoutes(router) {
	router.put('/users', async function(req, res) {
		const {
			body: { users },
		} = req;

		upsertLocalUsers(users);

		res.sendStatus(200);
	});

	router.put('/user', async function(req, res) {
		const {
			body: { user },
		} = req;

		upsertLocalUser(user);

		res.sendStatus(200);
	});
}

export default usersRoutes;

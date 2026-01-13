import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { API } from '../api';

type SignedInUser = {
	_id: IUser['_id'];
	username?: IUser['username'];
	name?: IUser['name'];
	role?: string;
	start?: string;
	end?: string;
};

API.v1.addRoute(
	'medsense.signedInUsers',
	{
		authRequired: true,
		permissionsRequired: ['view-full-other-user-info'],
	},
	{
		async get() {
			const nowIso = new Date().toISOString();
			const users = await Users.find(
				{
					'customFields.medsenseSignInRole': { $exists: true, $ne: '' },
					'customFields.medsenseSignInStart': { $lte: nowIso },
					'customFields.medsenseSignInEnd': { $gt: nowIso },
				},
				{ projection: { username: 1, name: 1, customFields: 1 } },
			).toArray();

			const signedInUsers: SignedInUser[] = users.map((user) => ({
				_id: user._id,
				username: user.username,
				name: user.name,
				role: user.customFields?.medsenseSignInRole as string | undefined,
				start: user.customFields?.medsenseSignInStart as string | undefined,
				end: user.customFields?.medsenseSignInEnd as string | undefined,
			}));

			return API.v1.success({ users: signedInUsers, count: signedInUsers.length });
		},
	},
);

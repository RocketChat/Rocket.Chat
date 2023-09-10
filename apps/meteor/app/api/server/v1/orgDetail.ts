
import { CustomSounds } from '@rocket.chat/models';
import { API } from '../api';


// we are using CustomSounds collection

API.v1.addRoute(
	'orglogo.list',
	{ authRequired: false },
	{
		async get() {
			const orgLogo = await CustomSounds.find({url : "http://localhost:3000/"} ).toArray();

			return API.v1.success({ orgLogo });
		},
	},
);

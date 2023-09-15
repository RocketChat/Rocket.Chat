
import { CustomSounds } from '@rocket.chat/models';
import { API } from '../api';


// we are using CustomSounds collection

API.v1.addRoute(
	'orgDetail.list',
	{ authRequired: false },
	{
		async get() {
			const orgLogo = await CustomSounds.find({url : "https://www.google.com/"} ).toArray();

			return API.v1.success({ orgLogo });
		},
	},
);

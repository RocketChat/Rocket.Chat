import type { IncomingMessage, ServerResponse } from 'http';

import { Analytics } from '@rocket.chat/core-services';
import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';

import { getSeatsRequestLink } from '../app/license/server/getSeatsRequestLink';

Meteor.startup(() => {
	WebApp.connectHandlers.use('/requestSeats/', async (_: IncomingMessage, res: ServerResponse) => {
		const url = await getSeatsRequestLink();

		await Analytics.saveSeatRequest();
		res.writeHead(302, { Location: url });
		res.end();
	});
});

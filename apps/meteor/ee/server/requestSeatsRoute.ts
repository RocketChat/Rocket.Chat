import type { IncomingMessage, ServerResponse } from 'http';

import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { Analytics } from '@rocket.chat/core-services';

import { getSeatsRequestLink } from '../app/license/server/getSeatsRequestLink';

Meteor.startup(() => {
	WebApp.connectHandlers.use(
		'/requestSeats/',
		Meteor.bindEnvironment((_: IncomingMessage, res: ServerResponse) => {
			const url = Promise.await(getSeatsRequestLink());

			Analytics.saveSeatRequest();
			res.writeHead(302, { Location: url });
			res.end();
		}),
	);
});

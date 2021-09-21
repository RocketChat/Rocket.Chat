import { IncomingMessage, ServerResponse } from 'http';

import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';

import { getSeatsRequestLink } from '../app/license/server/getSeatsRequestLink';
import { Analytics } from '../../server/sdk';
import { isEnterprise } from '../app/license/server/license';

Meteor.startup(() => {
	if (isEnterprise()) {
		WebApp.connectHandlers.use('/requestSeats/', Meteor.bindEnvironment((_: IncomingMessage, res: ServerResponse) => {
			const url = getSeatsRequestLink();

			Analytics.saveSeatRequest();
			res.writeHead(302, { Location: url });
			res.end();
		}));
	}
});

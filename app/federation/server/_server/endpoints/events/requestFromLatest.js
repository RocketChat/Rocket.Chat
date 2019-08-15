import { EJSON } from 'meteor/ejson';

import { API } from '../../../../../api/server';
import { Federation } from '../../../federation';
import { logger } from '../../../logger';
import { FederationRoomEvents } from '../../../../../models/server';

API.v1.addRoute('federation.events.requestFromLatest', { authRequired: false }, {
	async post() {
		if (!Federation.enabled) {
			return API.v1.failure('Not found');
		}

		const { fromDomain, contextType, contextQuery, latestEventIds } = EJSON.fromJSONValue(this.bodyParams);

		logger.server.debug(`federation.events.requestFromLatest => contextType=${ contextType } contextQuery=${ JSON.stringify(contextQuery, null, 2) } latestEventIds=${ latestEventIds.join(', ') }`);

		let EventsModel;

		// Define the model for the context
		switch (contextType) {
			case 'room':
				EventsModel = FederationRoomEvents;
				break;
		}

		// Get the oldest event from the latestEventIds
		const oldestEvent = EventsModel.findOne({ _id: { $in: latestEventIds } }, { $sort: { timestamp: 1 } });

		if (!oldestEvent) {
			return;
		}

		// Get all the missing events on this context, after the oldest one
		const missingEvents = EventsModel.find({ _id: { $nin: latestEventIds }, context: contextQuery, timestamp: { $gte: oldestEvent.timestamp } }, { sort: { timestamp: 1 } }).fetch();

		// Dispatch all the events, on the same request
		Federation.client.dispatchEvents([fromDomain], missingEvents);
	},
});

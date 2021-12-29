import { EJSON } from 'meteor/ejson';

import { API } from '../../../api/server';
import { serverLogger } from '../lib/logger';
import { FederationRoomEvents } from '../../../models/server';
import { decryptIfNeeded } from '../lib/crypt';
import { isFederationEnabled } from '../lib/isFederationEnabled';
import { dispatchEvents } from '../handler';

API.v1.addRoute(
	'federation.events.requestFromLatest',
	{ authRequired: false },
	{
		post() {
			if (!isFederationEnabled()) {
				return API.v1.failure('Federation not enabled');
			}

			//
			// Decrypt the payload if needed
			let payload;

			try {
				payload = Promise.await(decryptIfNeeded(this.request, this.bodyParams));
			} catch (err) {
				return API.v1.failure('Could not decrypt payload');
			}

			const { fromDomain, contextType, contextQuery, latestEventIds } = EJSON.fromJSONValue(payload);

			serverLogger.debug({
				msg: 'federation.events.requestFromLatest',
				contextType,
				contextQuery,
				latestEventIds,
			});

			let EventsModel;

			// Define the model for the context
			switch (contextType) {
				case 'room':
					EventsModel = FederationRoomEvents;
					break;
			}

			let missingEvents = [];

			if (latestEventIds.length) {
				// Get the oldest event from the latestEventIds
				const oldestEvent = EventsModel.findOne({ _id: { $in: latestEventIds } }, { $sort: { timestamp: 1 } });

				if (!oldestEvent) {
					return;
				}

				// Get all the missing events on this context, after the oldest one
				missingEvents = EventsModel.find(
					{
						_id: { $nin: latestEventIds },
						context: contextQuery,
						timestamp: { $gte: oldestEvent.timestamp },
					},
					{ sort: { timestamp: 1 } },
				).fetch();
			} else {
				// If there are no latest events, send all of them
				missingEvents = EventsModel.find({ context: contextQuery }, { sort: { timestamp: 1 } }).fetch();
			}

			// Dispatch all the events, on the same request
			Promise.await(dispatchEvents([fromDomain], missingEvents));

			return API.v1.success();
		},
	},
);

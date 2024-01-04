import { FederationRoomEvents } from '@rocket.chat/models';
import EJSON from 'ejson';

import { API } from '../../../api/server';
import { dispatchEvents } from '../handler';
import { decryptIfNeeded } from '../lib/crypt';
import { isFederationEnabled } from '../lib/isFederationEnabled';
import { serverLogger } from '../lib/logger';

API.v1.addRoute(
	'federation.events.requestFromLatest',
	{ authRequired: false },
	{
		async post() {
			if (!isFederationEnabled()) {
				return API.v1.failure('Federation not enabled');
			}

			//
			// Decrypt the payload if needed
			let payload;

			try {
				payload = await decryptIfNeeded(this.request, this.bodyParams);
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
				const oldestEvent = await EventsModel.findOne({ _id: { $in: latestEventIds } }, { $sort: { timestamp: 1 } });

				if (!oldestEvent) {
					return;
				}

				// Get all the missing events on this context, after the oldest one
				missingEvents = await EventsModel.find(
					{
						_id: { $nin: latestEventIds },
						context: contextQuery,
						timestamp: { $gte: oldestEvent.timestamp },
					},
					{ sort: { timestamp: 1 } },
				).toArray();
			} else {
				// If there are no latest events, send all of them
				missingEvents = await EventsModel.find({ context: contextQuery }, { sort: { timestamp: 1 } }).toArray();
			}

			// Dispatch all the events, on the same request
			await dispatchEvents([fromDomain], missingEvents);

			return API.v1.success();
		},
	},
);

import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { hasPermission } from '../../../authorization/client';
import { settings } from '../../../settings/client';
import { sdk } from '../../../utils/client/lib/SDKClient';
import { CannedResponse } from '../collections/CannedResponse';

const events = {
	changed: ({ type, ...response }) => {
		CannedResponse.upsert({ _id: response._id }, response);
	},
	removed: (response) => CannedResponse.remove({ _id: response._id }),
};

Meteor.startup(() => {
	Tracker.autorun(async (c) => {
		if (!Meteor.userId()) {
			return;
		}
		if (!settings.get('Canned_Responses_Enable')) {
			return;
		}
		if (!hasPermission('view-canned-responses')) {
			return;
		}
		Tracker.afterFlush(() => {
			try {
				// TODO: check options
				sdk.stream('canned-responses', ['canned-responses'], (response, options) => {
					const { agentsId } = options || {};
					if (Array.isArray(agentsId) && !agentsId.includes(Meteor.userId())) {
						return;
					}
					events[response.type](response);
				});
			} catch (error) {
				console.log(error);
			}
		});

		const { responses } = await sdk.rest.get('/v1/canned-responses.get');
		responses.forEach((response) => CannedResponse.insert(response));
		c.stop();
	});
});

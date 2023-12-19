import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { hasPermission } from '../../../../../app/authorization/client';
import { settings } from '../../../../../app/settings/client';
import { sdk } from '../../../../../app/utils/client/lib/SDKClient';
import { CannedResponse } from '../collections/CannedResponse';

const events = {
	changed: async ({ type, ...response }) => {
		await CannedResponse.upsertAsync({ _id: response._id }, response);
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
		try {
			// TODO: check options
			sdk.stream('canned-responses', 'canned-responses', async (response, options) => {
				const { agentsId } = options || {};
				if (Array.isArray(agentsId) && !agentsId.includes(Meteor.userId())) {
					return;
				}
				await events[response.type](response);
			});
			const { responses } = await sdk.rest.get('/v1/canned-responses.get');
			responses.forEach((response) => CannedResponse.insert(response));
			c.stop();
		} catch (error) {
			console.log(error);
		}
	});
});

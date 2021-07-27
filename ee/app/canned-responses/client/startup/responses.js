import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { hasPermission } from '../../../../../app/authorization/client';
import { settings } from '../../../../../app/settings/client';
import { APIClient } from '../../../../../app/utils/client';
import { CannedResponse } from '../collections/CannedResponse';
import { cannedResponsesStreamer } from '../streamer';

const events = {
	changed: (response) => {
		delete response.type;
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
		try {
			cannedResponsesStreamer.on('canned-responses', (response, options) => {
				const { agentsId } = options || {};
				if (Array.isArray(agentsId) && !agentsId.includes(Meteor.userId())) {
					return;
				}
				events[response.type](response);
			});
			const { responses } = await APIClient.v1.get('canned-responses.get');
			responses.forEach((response) => CannedResponse.insert(response));
			c.stop();
		} catch (error) {
			console.log(error);
		}
	});
});

import { FlowRouter } from 'meteor/kadira:flow-router';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { navigate } from '../lib/router';

Meteor.startup(() => {
	Tracker.afterFlush(() => {
		const resumeToken = FlowRouter.getQueryParam('resumeToken');
		if (!resumeToken) {
			return;
		}

		Meteor.loginWithToken(resumeToken, () => {
			if (FlowRouter.getRouteName()) {
				FlowRouter.setQueryParams({ resumeToken: null, userId: null });
				return;
			}
			navigate('/home');
		});
	});
});

import { FlowRouter } from 'meteor/kadira:flow-router';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { router } from '../providers/RouterProvider';

Meteor.startup(() => {
	Tracker.afterFlush(() => {
		const { resumeToken } = router.getSearchParameters();
		if (!resumeToken) {
			return;
		}

		Meteor.loginWithToken(resumeToken, () => {
			if (FlowRouter.getRouteName()) {
				FlowRouter.setQueryParams({ resumeToken: null, userId: null });
				return;
			}
			router.navigate('/home');
		});
	});
});

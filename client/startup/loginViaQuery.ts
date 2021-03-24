import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';

Meteor.startup(() => {
	const resumeToken = FlowRouter.getQueryParam('resumeToken');
	if (!resumeToken) {
		return;
	}

	Meteor.loginWithToken(resumeToken, () => {
		if (FlowRouter.getRouteName()) {
			FlowRouter.setQueryParams({ resumeToken: null, userId: null });
			return;
		}
		FlowRouter.go('/home');
	});
});

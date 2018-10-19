import { Meteor } from 'meteor/meteor';
Meteor.startup(() => {
	if (FlowRouter.getQueryParam('resumeToken')) {
		Meteor.loginWithToken(FlowRouter.getQueryParam('resumeToken'), () => {
			FlowRouter.go('/home');
		});
	}
});

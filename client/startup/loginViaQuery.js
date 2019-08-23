import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

Meteor.startup(() => {
	if (FlowRouter.getQueryParam('resumeToken')) {
		Meteor.loginWithToken(FlowRouter.getQueryParam('resumeToken'), () => {
			FlowRouter.go('/home');
		});
	}
});

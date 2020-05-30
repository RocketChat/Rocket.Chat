import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

Meteor.loginWithLoginToken = function(token) {
	Accounts.callLoginMethod({
		methodArguments: [{
			loginToken: token,
		}],
		userCallback(error) {
			if (!error) {
				FlowRouter.go('/');
			}
		},
	});
};

FlowRouter.route('/login-token/:token', {
	name: 'tokenLogin',
	action() {
		BlazeLayout.render('loginLayout');
		Meteor.loginWithLoginToken(this.getParam('token'));
	},
});

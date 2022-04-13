import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { FlowRouter } from 'meteor/kadira:flow-router';

const blockstackLogin = (authResponse, userData = {}) => {
	Accounts.callLoginMethod({
		methodArguments: [
			{
				blockstack: true,
				authResponse,
				userData,
			},
		],
		userCallback() {
			FlowRouter.go('home');
		},
	});
};

FlowRouter.route('/_blockstack/validate', {
	name: 'blockstackValidate',
	async action(params, queryParams) {
		const blockstack = await import('blockstack/dist/blockstack');

		if (Meteor.userId()) {
			console.log('Blockstack Auth requested when already logged in. Reloading.');
			return FlowRouter.go('home');
		}

		if (queryParams.authResponse == null) {
			throw new Meteor.Error('Blockstack: Auth request without response param.');
		}

		let userData;

		if (blockstack.isUserSignedIn()) {
			userData = blockstack.loadUserData();
		}

		if (blockstack.isSignInPending()) {
			userData = await blockstack.handlePendingSignIn();
		}

		blockstackLogin(queryParams.authResponse, userData);
	},
});

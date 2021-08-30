import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { FlowRouter } from 'meteor/kadira:flow-router';

FlowRouter.route('/_blockstack/validate', {
	name: 'blockstackValidate',
	async action(params, { authResponse }) {
		if (Meteor.userId()) {
			console.log('Blockstack Auth requested when already logged in. Reloading.');
			FlowRouter.go('/');
			return;
		}

		if (!authResponse) {
			throw new Meteor.Error('Blockstack: Auth request without response param.');
		}

		const blockstack = await import('blockstack/dist/blockstack');
		let userData = {};

		if (blockstack.isUserSignedIn()) {
			userData = blockstack.loadUserData();
		}

		if (blockstack.isSignInPending()) {
			userData = await blockstack.handlePendingSignIn();
		}

		Accounts.callLoginMethod({
			methodArguments: [{
				blockstack: true,
				authResponse,
				userData,
			}],
			userCallback() {
				FlowRouter.go('/');
			},
		});
	},
});

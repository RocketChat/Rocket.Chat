Meteor.methods({
	updateUserTokenlyBalances() {
		const user = Meteor.user();

		if (user && user.services && user.services.tokenly) {
			const tcaPublicBalances = Meteor.call('getPublicTokenpassBalances', user.services.tokenly.accessToken);
			const tcaProtectedBalances = Meteor.call('getProtectedTokenpassBalances', user.services.tokenly.accessToken);

			const balances = _.uniq(_.union(tcaPublicBalances, tcaProtectedBalances), false, function(item) { return item.asset; });

			RocketChat.models.Users.setTokenlyTcaBalances(user._id, balances);
		}
	}
});

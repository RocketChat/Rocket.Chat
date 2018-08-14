import _ from 'underscore';

RocketChat.updateUserTokenpassBalances = function(user) {
	if (user && user.services && user.services.tokenpass) {
		const tcaPublicBalances = RocketChat.getPublicTokenpassBalances(user.services.tokenpass.accessToken);
		const tcaProtectedBalances = RocketChat.getProtectedTokenpassBalances(user.services.tokenpass.accessToken);

		const balances = _.uniq(_.union(tcaPublicBalances, tcaProtectedBalances), false, item => item.asset);

		RocketChat.models.Users.setTokenpassTcaBalances(user._id, balances);

		return balances;
	}
};

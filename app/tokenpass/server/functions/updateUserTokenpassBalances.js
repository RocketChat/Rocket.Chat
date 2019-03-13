import { Users } from '/app/models';
import { getPublicTokenpassBalances } from './getPublicTokenpassBalances';
import { getProtectedTokenpassBalances } from './getProtectedTokenpassBalances';
import _ from 'underscore';

export const updateUserTokenpassBalances = function(user) {
	if (user && user.services && user.services.tokenpass) {
		const tcaPublicBalances = getPublicTokenpassBalances(user.services.tokenpass.accessToken);
		const tcaProtectedBalances = getProtectedTokenpassBalances(user.services.tokenpass.accessToken);

		const balances = _.uniq(_.union(tcaPublicBalances, tcaProtectedBalances), false, (item) => item.asset);

		Users.setTokenpassTcaBalances(user._id, balances);

		return balances;
	}
};

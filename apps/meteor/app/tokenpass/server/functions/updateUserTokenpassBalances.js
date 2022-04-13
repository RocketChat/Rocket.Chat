import _ from 'underscore';

import { getPublicTokenpassBalances } from './getPublicTokenpassBalances';
import { getProtectedTokenpassBalances } from './getProtectedTokenpassBalances';
import { Users } from '../../../models';

export const updateUserTokenpassBalances = function (user) {
	if (user && user.services && user.services.tokenpass) {
		const tcaPublicBalances = getPublicTokenpassBalances(user.services.tokenpass.accessToken);
		const tcaProtectedBalances = getProtectedTokenpassBalances(user.services.tokenpass.accessToken);

		const balances = _.uniq(_.union(tcaPublicBalances, tcaProtectedBalances), false, (item) => item.asset);

		Users.setTokenpassTcaBalances(user._id, balances);

		return balances;
	}
};

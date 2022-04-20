import { Tokenpass } from './Tokenpass';
import { Users } from '../../models';

export function validateTokenAccess(userData, roomData) {
	if (!userData || !userData.services || !userData.services.tokenpass || !userData.services.tokenpass.tcaBalances) {
		return false;
	}

	return Tokenpass.validateAccess(roomData.tokenpass, userData.services.tokenpass.tcaBalances);
}

export const validators = [
	function (room, user) {
		const userData = Users.getTokenBalancesByUserId(user._id);

		return validateTokenAccess(userData, room);
	},
];

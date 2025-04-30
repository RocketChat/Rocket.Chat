import { Users } from '@rocket.chat/models';
import { Accounts } from 'meteor/accounts-base';

export const removeOtherTokens = async function (userId: string, connectionId: string): Promise<void> {
	const currentToken = Accounts._getLoginToken(connectionId);

	await Users.removeNonLoginTokensExcept(userId, currentToken);
};

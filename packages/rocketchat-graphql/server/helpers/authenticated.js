import { AccountsServer } from 'meteor/rocketchat:accounts';
//import { authenticated as _authenticated } from '@accounts/graphql-api';
import { authenticated as _authenticated } from '../mocks/accounts/graphql-api';

export const authenticated = (resolver) => {
	return _authenticated(AccountsServer, resolver);
};

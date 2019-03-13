import { AccountsServer } from '/app/accounts';
// import { authenticated as _authenticated } from '@accounts/graphql-api';
import { authenticated as _authenticated } from '../mocks/accounts/graphql-api';

export const authenticated = (resolver) => _authenticated(AccountsServer, resolver);

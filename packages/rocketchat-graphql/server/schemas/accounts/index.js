import { createJSAccountsGraphQL } from '@accounts/graphql-api';
import { AccountsServer } from 'meteor/rocketchat:accounts';

const accountsGraphQL = createJSAccountsGraphQL(AccountsServer);

export const schema = accountsGraphQL.schema;

export const resolvers = accountsGraphQL.extendWithResolvers({});

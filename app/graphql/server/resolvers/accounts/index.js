import { createJSAccountsGraphQL } from '@accounts/graphql-api';
import { mergeTypes, mergeResolvers } from 'merge-graphql-schemas';


// queries
import * as oauthProviders from './oauthProviders';
// types
import * as OauthProviderType from './OauthProvider-type';
import { AccountsServer } from '../../../../accounts';

const accountsGraphQL = createJSAccountsGraphQL(AccountsServer);

export const schema = mergeTypes([
	accountsGraphQL.schema,
	oauthProviders.schema,
	OauthProviderType.schema,
]);

export const resolvers = mergeResolvers([
	accountsGraphQL.extendWithResolvers({}),
	oauthProviders.resolver,
]);

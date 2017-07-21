import { Meteor } from 'meteor/meteor';
import { AccountsServer } from 'meteor/rocketchat:accounts';
import { authenticated as _authenticated } from '@accounts/graphql-api';

export const authenticated = (resolver) => {
	return _authenticated(AccountsServer, Meteor.bindEnvironment(resolver), (error) => { throw error; });
};

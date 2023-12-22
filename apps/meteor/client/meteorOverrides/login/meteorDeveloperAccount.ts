import { Meteor } from 'meteor/meteor';
import { MeteorDeveloperAccounts } from 'meteor/meteor-developer-oauth';

import { overrideLoginMethod } from '../../lib/2fa/overrideLoginMethod';
import { createOAuthTotpLoginMethod } from './oauth';

const { loginWithMeteorDeveloperAccount } = Meteor;
const loginWithMeteorDeveloperAccountAndTOTP = createOAuthTotpLoginMethod(MeteorDeveloperAccounts);
Meteor.loginWithMeteorDeveloperAccount = (options, callback) => {
	overrideLoginMethod(loginWithMeteorDeveloperAccount, [options], callback, loginWithMeteorDeveloperAccountAndTOTP);
};

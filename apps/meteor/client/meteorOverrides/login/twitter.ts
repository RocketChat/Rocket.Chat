import { Meteor } from 'meteor/meteor';
import { Twitter } from 'meteor/twitter-oauth';

import { overrideLoginMethod } from '../../lib/2fa/overrideLoginMethod';
import { createOAuthTotpLoginMethod } from './oauth';

const { loginWithTwitter } = Meteor;
const loginWithTwitterAndTOTP = createOAuthTotpLoginMethod(Twitter);
Meteor.loginWithTwitter = (options, callback) => {
	overrideLoginMethod(loginWithTwitter, [options], callback, loginWithTwitterAndTOTP);
};

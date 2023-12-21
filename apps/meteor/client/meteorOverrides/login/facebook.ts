import { Facebook } from 'meteor/facebook-oauth';
import { Meteor } from 'meteor/meteor';

import { overrideLoginMethod } from '../../lib/2fa/overrideLoginMethod';
import { createOAuthTotpLoginMethod } from './oauth';

const { loginWithFacebook } = Meteor;
const loginWithFacebookAndTOTP = createOAuthTotpLoginMethod(() => Facebook);
Meteor.loginWithFacebook = (options, callback) => {
	overrideLoginMethod(loginWithFacebook, [options], callback, loginWithFacebookAndTOTP);
};

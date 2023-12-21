import { Meteor } from 'meteor/meteor';
import { Linkedin } from 'meteor/pauli:linkedin-oauth';

import type { LoginCallback } from '../../lib/2fa/overrideLoginMethod';
import { overrideLoginMethod } from '../../lib/2fa/overrideLoginMethod';
import { createOAuthTotpLoginMethod } from './oauth';

declare module 'meteor/meteor' {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Meteor {
		function loginWithLinkedin(options?: Meteor.LoginWithExternalServiceOptions, callback?: LoginCallback): void;
	}
}
const { loginWithLinkedin } = Meteor;
const loginWithLinkedinAndTOTP = createOAuthTotpLoginMethod(() => Linkedin);
Meteor.loginWithLinkedin = (options, callback) => {
	overrideLoginMethod(loginWithLinkedin, [options], callback, loginWithLinkedinAndTOTP);
};

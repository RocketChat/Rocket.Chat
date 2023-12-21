import { Github } from 'meteor/github-oauth';
import { Meteor } from 'meteor/meteor';

import { overrideLoginMethod } from '../../lib/2fa/overrideLoginMethod';
import { createOAuthTotpLoginMethod } from './oauth';

const { loginWithGithub } = Meteor;
const loginWithGithubAndTOTP = createOAuthTotpLoginMethod(() => Github);
Meteor.loginWithGithub = (options, callback) => {
	overrideLoginMethod(loginWithGithub, [options], callback, loginWithGithubAndTOTP);
};

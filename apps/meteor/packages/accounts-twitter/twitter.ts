import { Accounts } from 'meteor/accounts-base';
import { Twitter } from 'meteor/twitter-oauth';

Accounts.oauth.registerService('twitter');

const autopublishedFields = Twitter.whitelistedFields.concat(['id', 'screenName']).map((subfield) => `services.twitter.${subfield}`);

Accounts.addAutopublishFields({
	forLoggedInUser: autopublishedFields,
	forOtherUsers: autopublishedFields,
});

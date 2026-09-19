import { Accounts } from 'meteor/accounts-base';

Accounts.oauth.registerService('meteor-developer');

Accounts.addAutopublishFields({
	// publish all fields including access token, which can legitimately be used
	// from the client (if transmitted over ssl or on localhost).
	forLoggedInUser: ['services.meteor-developer'],
	forOtherUsers: ['services.meteor-developer.username', 'services.meteor-developer.profile', 'services.meteor-developer.id'],
});

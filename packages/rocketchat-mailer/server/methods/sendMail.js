/*globals Mailer */
Meteor.methods({
	'Mailer.sendMail'(from, subject, body, dryrun, query) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'Mailer.sendMail'
			});
		}
		if (RocketChat.authz.hasRole(userId, 'admin') !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'Mailer.sendMail'
			});
		}
		return Mailer.sendMail(from, subject, body, dryrun, query);
	}
});


//Limit setting username once per minute
//DDPRateLimiter.addRule
//	type: 'method'
//	name: 'Mailer.sendMail'
//	connectionId: -> return true
//	, 1, 60000

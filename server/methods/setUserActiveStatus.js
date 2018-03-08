Meteor.methods({
	setUserActiveStatus(userId, active) {
		check(userId, String);
		check(active, Boolean);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'setUserActiveStatus'
			});
		}

		if (RocketChat.authz.hasPermission(Meteor.userId(), 'edit-other-user-active-status') !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'setUserActiveStatus'
			});
		}

		const user = RocketChat.models.Users.findOneById(userId);

		if (user) {
			RocketChat.models.Users.setUserActive(userId, active);

			if (user.username) {
				RocketChat.models.Subscriptions.setArchivedByUsername(user.username, !active);
			}

			if (active === false) {
				RocketChat.models.Users.unsetLoginTokens(userId);
			} else {
				RocketChat.models.Users.unsetReason(userId);
			}

			const destinations = Array.isArray(user.emails) && user.emails.map(email => `${ user.name || user.username }<${ email.address }>`);

			if (destinations) {
				const email = {
					to: destinations,
					from: RocketChat.settings.get('From_Email'),
					subject: Accounts.emailTemplates.userActivated.subject({active}),
					html: Accounts.emailTemplates.userActivated.html({active, name: user.name, username: user.username})
				};

				Meteor.defer(() => Email.send(email));
			}

			return true;
		}

		return false;
	}
});

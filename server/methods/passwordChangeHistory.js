Meteor.methods({
	addPasswordChangeHistory(userId) {
		userId = userId || Meteor.userId();

		const passwordChangeOccurrence = RocketChat.models.Users.addPasswordChangeHistory(userId);

		if (RocketChat.settings.get('Accounts_AdminsReceivePasswordChangeHistory') === 'immediately') {
			Meteor.call('sendPasswordChangeHistoryForAdmins', passwordChangeOccurrence);
		}
	},

	sendPasswordChangeHistoryForAdmins(passwordChangeOccurrence) {
		// TODO: #2995
		const header = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Header') || '');
		const footer = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Footer') || '');

		let subject;
		let html;
		let email;
		let language;

		const admins = RocketChat.authz.getUsersInRole('admin').fetch();

		let passwordChangeOccurrences = [];

		if (RocketChat.settings.get('Accounts_AdminsReceivePasswordChangeHistory') === 'immediately') {
			passwordChangeOccurrences.push(passwordChangeOccurrence);
		} else if (RocketChat.settings.get('Accounts_AdminsReceivePasswordChangeHistory') === 'daily' || RocketChat.settings.get('Accounts_AdminsReceivePasswordChangeHistory') === 'weekly') {
			passwordChangeOccurrences = RocketChat.models.Users.getUsersWithPasswordChanged();
		}

		if (!_.isEmpty(passwordChangeOccurrences)) {
			_.each(admins, (admin) => {
				// Selecting language and the translating for each admin user
				language = admin && admin.language || RocketChat.settings.get('language') || 'en';
				if (RocketChat.settings.get('Accounts_AdminsReceivePasswordChangeHistory') === 'immediately') {
					subject = TAPi18n.__('Accounts_AdminsReceivePasswordChangeHistory_EmailSubject_Immediately', { lng: language });
					html = TAPi18n.__('Accounts_AdminsReceivePasswordChangeHistory_EmailBody_Immediately', { lng: language });
				}
				if (RocketChat.settings.get('Accounts_AdminsReceivePasswordChangeHistory') === 'daily') {
					subject = TAPi18n.__('Accounts_AdminsReceivePasswordChangeHistory_EmailSubject_Daily', { lng: language });
					html = TAPi18n.__('Accounts_AdminsReceivePasswordChangeHistory_EmailBody_Daily', { lng: language });
				}
				if (RocketChat.settings.get('Accounts_AdminsReceivePasswordChangeHistory') === 'weekly') {
					subject = TAPi18n.__('Accounts_AdminsReceivePasswordChangeHistory_EmailSubject_Weekly', { lng: language });
					html = TAPi18n.__('Accounts_AdminsReceivePasswordChangeHistory_EmailBody_Weekly', { lng: language });
				}

				subject = RocketChat.placeholders.replace(subject);

				html = RocketChat.placeholders.replace(html, {
					name: admin.name,
					passwordChangeOccurrences
				});

				email = {
					to: admin.email,
					from: RocketChat.settings.get('From_Email'),
					subject,
					html: header + html + footer
				};

				Meteor.defer(function() {
					try {
						Email.send(email);
					} catch (error) {
						throw new Meteor.Error('error-email-send-failed', `Error trying to send email: ${ error.message }`, { function: 'sendPasswordChangeLogForAdmins', message: error.message });
					}
				});
			});
		}
	}
});

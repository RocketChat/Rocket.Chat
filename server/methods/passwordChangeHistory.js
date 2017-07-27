import moment from 'moment';

Meteor.methods({
	addPasswordChangeHistory(userId) {
		userId = userId || Meteor.userId();

		const passwordChangeHistoryResult = RocketChat.models.Users.addPasswordChangeHistory(userId);

		const userAffected = RocketChat.models.Users.findById(userId);
		const userChanger = RocketChat.models.Users.findById(passwordChangeHistoryResult.changedBy);

		const passwordChangeOccurrenceParams = {
			userAffectedName: userAffected.name,
			userAffectedUsername: userAffected.username,
			userChangerUsername: userChanger.username,
			changedAt: passwordChangeHistoryResult.changedAt
		};

		if (RocketChat.settings.get('Accounts_AdminsReceivePasswordChangeHistory') === 'immediately') {
			Meteor.call('sendPasswordChangeHistoryForAdmins', passwordChangeOccurrenceParams);
		}

		return passwordChangeOccurrenceParams;
	},

	sendPasswordChangeHistoryForAdmins(passwordChangeOccurrenceParams) {
		if (RocketChat.settings.get('Accounts_AdminsReceivePasswordChangeHistory') !== 'disabled') {
			const header = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Header') || '');
			const footer = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Footer') || '');

			let subject;
			let html;
			let email;
			let language;
			let templatePasswordChangeOccurrences = '';
			let fromDate;
			const today = new Date();
			const passwordChangeOccurrences = [];
			let passwordChangeOccurrencesParams = {};

			if (RocketChat.settings.get('Accounts_AdminsReceivePasswordChangeHistory') === 'immediately') {
				passwordChangeOccurrencesParams = passwordChangeOccurrenceParams;
			} else {
				if (RocketChat.settings.get('Accounts_AdminsReceivePasswordChangeHistory') === 'daily') {
					fromDate = moment(new Date()).subtract(1, 'days').toDate();
				} else if (RocketChat.settings.get('Accounts_AdminsReceivePasswordChangeHistory') === 'weekly') {
					fromDate = moment(new Date()).subtract(7, 'days').toDate();
				}

				const usersWithPasswordChanged = RocketChat.models.Users.getUsersWithPasswordChanged(fromDate, today);

				if (!_.isEmpty(usersWithPasswordChanged)) {
					let userChanger;

					_.each(usersWithPasswordChanged, (userAffected) => {
						_.each(userAffected.passwordChangeHistory, (passwordChange) => {
							if (moment(passwordChange.changedAt).isBetween(moment(fromDate), moment(today))) {
								userChanger = RocketChat.models.Users.findById(passwordChange.changedBy);
								passwordChangeOccurrences.push({
									userAffectedName: userAffected.name,
									userAffectedUsername: userAffected.username,
									userChangerUsername: userChanger.username,
									changedAt: passwordChange.changedAt
								});
							}
						});
					});
				}
			}

			if (passwordChangeOccurrenceParams || !_.isEmpty(passwordChangeOccurrences)) {
				const admins = RocketChat.authz.getUsersInRole('admin').fetch();

				_.each(admins, (admin) => {
					language = admin && admin.language || RocketChat.settings.get('language') || 'en';

					if (RocketChat.settings.get('Accounts_AdminsReceivePasswordChangeHistory') === 'immediately') {
						subject = TAPi18n.__('Accounts_AdminsReceivePasswordChangeHistory_Immediately_EmailSubject', { lng: language });
						html = TAPi18n.__('Accounts_AdminsReceivePasswordChangeHistory_Immediately_EmailBody', { lng: language });
					}
					if (RocketChat.settings.get('Accounts_AdminsReceivePasswordChangeHistory') === 'daily') {
						subject = TAPi18n.__('Accounts_AdminsReceivePasswordChangeHistory_Daily_EmailSubject', { lng: language });
						html = TAPi18n.__('Accounts_AdminsReceivePasswordChangeHistory_Daily_EmailBody', { lng: language });
						templatePasswordChangeOccurrences = TAPi18n.__('Accounts_AdminsReceivePasswordChangeHistory_Daily_EmailBody_Occurrences', { lng: language });
					}
					if (RocketChat.settings.get('Accounts_AdminsReceivePasswordChangeHistory') === 'weekly') {
						subject = TAPi18n.__('Accounts_AdminsReceivePasswordChangeHistory_Weekly_EmailSubject', { lng: language });
						html = TAPi18n.__('Accounts_AdminsReceivePasswordChangeHistory_Weekly_EmailBody', { lng: language });
						templatePasswordChangeOccurrences = TAPi18n.__('Accounts_AdminsReceivePasswordChangeHistory_Weekly_EmailBody_Occurrences', { lng: language });
					}

					_.each(passwordChangeOccurrences, (occurrence) => {
						passwordChangeOccurrencesParams.passwordChangeOccurrencesList += RocketChat.placeholders.replace(templatePasswordChangeOccurrences, occurrence);
					});

					html = RocketChat.placeholders.replace(html, {
						name: admin.name,
						passwordChangeOccurrencesParams
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
							throw new Meteor.Error('error-email-send-failed', `Error trying to send email: ${ error.message }`, { function: 'sendPasswordChangeHistoryForAdmins', message: error.message });
						}
					});
				});
			}
		}
	}
});

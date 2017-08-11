import moment from 'moment';

Meteor.methods({
	sendPasswordChangeLogForAdmins() {
		if (RocketChat.settings.get('Accounts_AdminsReceivePasswordChangeLog') !== 'disabled') {
			let fromDate;

			if (RocketChat.settings.get('Accounts_AdminsReceivePasswordChangeLog') === 'daily') {
				fromDate = new Date(moment().subtract(1, 'days').format());
			} else if (RocketChat.settings.get('Accounts_AdminsReceivePasswordChangeLog') === 'weekly') {
				fromDate = new Date(moment().subtract(7, 'days').format());
			}

			const passwordChangeLog = RocketChat.models.AuditLog.find({
				'result.path': 'password',
				collection: 'users',
				action: 'update',
				timestamp: { $gte: fromDate, $lte: new Date() }
			}).fetch();

			if (!_.isEmpty(passwordChangeLog)) {
				let userAffected;
				let userChanger;
				const passwordChangeOccurrences = [];

				_.each(passwordChangeLog, (log) => {
					userAffected = RocketChat.models.Users.findOne({_id: log.docId}, {fields: {name: 1, username: 1}});
					userChanger = RocketChat.models.Users.findOne({_id: log.userId}, {fields: {username: 1}});

					passwordChangeOccurrences.push({
						userAffectedName: userAffected.name,
						userAffectedUsername: userAffected.username,
						userChangerUsername: userChanger.username,
						changedAt: log.timestamp
					});
				});

				const admins = RocketChat.authz.getUsersInRole('admin').fetch();
				const header = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Header') || '');
				const footer = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Footer') || '');

				let subject;
				let html;
				let email;
				let emailBodyParams;
				let templatePasswordChangeOccurrences = '';
				let language;

				_.each(admins, (admin) => {
					language = admin && admin.language || RocketChat.settings.get('language') || 'en';

					if (RocketChat.settings.get('Accounts_AdminsReceivePasswordChangeLog') === 'daily') {
						subject = TAPi18n.__('Accounts_AdminsReceivePasswordChangeLog_Daily_EmailSubject', { lng: language });
						html = TAPi18n.__('Accounts_AdminsReceivePasswordChangeLog_Daily_EmailBody', { lng: language });
						templatePasswordChangeOccurrences = TAPi18n.__('Accounts_AdminsReceivePasswordChangeLog_Daily_EmailBody_Occurrences', { lng: language });
					}

					if (RocketChat.settings.get('Accounts_AdminsReceivePasswordChangeLog') === 'weekly') {
						subject = TAPi18n.__('Accounts_AdminsReceivePasswordChangeLog_Weekly_EmailSubject', { lng: language });
						html = TAPi18n.__('Accounts_AdminsReceivePasswordChangeLog_Weekly_EmailBody', { lng: language });
						templatePasswordChangeOccurrences = TAPi18n.__('Accounts_AdminsReceivePasswordChangeLog_Weekly_EmailBody_Occurrences', { lng: language });
					}

					emailBodyParams = {
						name: admin.name,
						passwordChangeOccurrencesList: ''
					};

					_.each(passwordChangeOccurrences, (occurrence) => {
						emailBodyParams.passwordChangeOccurrencesList += RocketChat.placeholders.replace(templatePasswordChangeOccurrences, occurrence);
					});

					html = RocketChat.placeholders.replace(html, emailBodyParams);

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
	}
});

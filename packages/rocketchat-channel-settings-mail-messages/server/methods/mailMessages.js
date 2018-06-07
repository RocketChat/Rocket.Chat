import _ from 'underscore';
import moment from 'moment';

Meteor.methods({
	'mailMessages'(data) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'mailMessages'
			});
		}
		check(data, Match.ObjectIncluding({
			rid: String,
			to_users: [String],
			to_emails: String,
			subject: String,
			messages: [String],
			language: String
		}));
		const room = Meteor.call('canAccessRoom', data.rid, Meteor.userId());
		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'mailMessages'
			});
		}
		if (!RocketChat.authz.hasPermission(Meteor.userId(), 'mail-messages')) {
			throw new Meteor.Error('error-action-not-allowed', 'Mailing is not allowed', {
				method: 'mailMessages',
				action: 'Mailing'
			});
		}
		const rfcMailPatternWithName = /^(?:.*<)?([a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)(?:>?)$/;
		const emails = _.compact(data.to_emails.trim().split(','));
		const missing = [];
		if (data.to_users.length > 0) {
			_.each(data.to_users, (username) => {
				const user = RocketChat.models.Users.findOneByUsername(username);
				if (user && user.emails && user.emails[0] && user.emails[0].address) {
					emails.push(user.emails[0].address);
				} else {
					missing.push(username);
				}
			});
		}
		console.log('Sending messages to e-mails: ', emails);
		_.each(emails, (email) => {
			if (!rfcMailPatternWithName.test(email.trim())) {
				throw new Meteor.Error('error-invalid-email', `Invalid email ${ email }`, {
					method: 'mailMessages',
					email
				});
			}
		});
		const user = Meteor.user();
		const email = user.emails && user.emails[0] && user.emails[0].address;
		data.language = data.language.split('-').shift().toLowerCase();
		if (data.language !== 'en') {
			const localeFn = Meteor.call('loadLocale', data.language);
			if (localeFn) {
				Function(localeFn).call({moment});
				moment.locale(data.language);
			}
		}

		const header = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Header') || '');
		const footer = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Footer') || '');
		const html = RocketChat.models.Messages.findByRoomIdAndMessageIds(data.rid, data.messages, {
			sort: {	ts: 1 }
		}).map(function(message) {
			const dateTime = moment(message.ts).locale(data.language).format('L LT');
			return `<p style='margin-bottom: 5px'><b>${ message.u.username }</b> <span style='color: #aaa; font-size: 12px'>${ dateTime }</span><br />${ RocketChat.Message.parse(message, data.language) }</p>`;
		}).join('');

		Meteor.defer(function() {
			Email.send({
				to: emails,
				from: RocketChat.settings.get('From_Email'),
				replyTo: email,
				subject: data.subject,
				html: header + html + footer
			});
			return console.log(`Sending email to ${ emails.join(', ') }`);
		});
		return {
			success: true,
			missing
		};
	}
});

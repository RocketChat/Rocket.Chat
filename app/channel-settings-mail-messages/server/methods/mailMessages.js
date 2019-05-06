import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { hasPermission } from '../../../authorization';
import { Users, Messages } from '../../../models';
import { settings } from '../../../settings';
import { Message } from '../../../ui-utils';
import _ from 'underscore';
import moment from 'moment';
import * as Mailer from '../../../mailer';

Meteor.methods({
	'mailMessages'(data) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'mailMessages',
			});
		}
		check(data, Match.ObjectIncluding({
			rid: String,
			to_users: [String],
			to_emails: String,
			subject: String,
			messages: [String],
			language: String,
		}));
		const room = Meteor.call('canAccessRoom', data.rid, userId);
		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'mailMessages',
			});
		}
		if (!hasPermission(userId, 'mail-messages')) {
			throw new Meteor.Error('error-action-not-allowed', 'Mailing is not allowed', {
				method: 'mailMessages',
				action: 'Mailing',
			});
		}

		const emails = _.compact(data.to_emails.trim().split(','));
		const missing = [];
		if (data.to_users.length > 0) {
			_.each(data.to_users, (username) => {
				const user = Users.findOneByUsernameIgnoringCase(username);
				if (user && user.emails && user.emails[0] && user.emails[0].address) {
					emails.push(user.emails[0].address);
				} else {
					missing.push(username);
				}
			});
		}
		_.each(emails, (email) => {
			if (!Mailer.checkAddressFormat(email.trim())) {
				throw new Meteor.Error('error-invalid-email', `Invalid email ${ email }`, {
					method: 'mailMessages',
					email,
				});
			}
		});
		const user = Meteor.user();
		const email = user.emails && user.emails[0] && user.emails[0].address;
		data.language = data.language.split('-').shift().toLowerCase();
		if (data.language !== 'en') {
			const localeFn = Meteor.call('loadLocale', data.language);
			if (localeFn) {
				Function(localeFn).call({ moment });
				moment.locale(data.language);
			}
		}

		const html = Messages.findByRoomIdAndMessageIds(data.rid, data.messages, {
			sort: {	ts: 1 },
		}).map(function(message) {
			const dateTime = moment(message.ts).locale(data.language).format('L LT');
			return `<p style='margin-bottom: 5px'><b>${ message.u.username }</b> <span style='color: #aaa; font-size: 12px'>${ dateTime }</span><br/>${ Message.parse(message, data.language) }</p>`;
		}).join('');

		Mailer.send({
			to: emails,
			from: settings.get('From_Email'),
			replyTo: email,
			subject: data.subject,
			html,
		});

		return {
			success: true,
			missing,
		};
	},
});

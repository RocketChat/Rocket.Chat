import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

import { API } from '../api';
import { findEmailsInbox, findOneEmailsInbox } from '../lib/emailInbox';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { EmailInbox, Users } from '../../../models';

API.v1.addRoute('email-inbox.list', { authRequired: true }, {
	get() {
		try {
			const { offset, count } = this.getPaginationItems();
			const { sort, query } = this.parseJsonQuery();
			const emailsInbox = Promise.await(findEmailsInbox({ userId: this.userId, query, pagination: { offset, count, sort } }));
			return API.v1.success(emailsInbox);
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});

API.v1.addRoute('email-inbox', { authRequired: true }, {
	get() {
		try {
			check(this.queryParams, {
				_id: Match.Maybe(String),
			});
			const { _id } = this.queryParams;

			const emailsInbox = Promise.await(findOneEmailsInbox({ userId: this.userId, _id }));

			if (!emailsInbox) {
				throw new Meteor.Error('email-inbox-not-found');
			}

			return API.v1.success(emailsInbox);
		} catch (e) {
			return API.v1.failure(e);
		}
	},
	post() {
		try {
			check(this.bodyParams, {
				_id: Match.Maybe(String),
				name: String,
				email: String,
				active: Boolean,
				description: Match.Maybe(String),
				senderInfo: Match.Maybe(String),
				department: Match.Maybe(String),
				smtp: Object,
				imap: Object,
			});

			const emailsInboxParams = this.bodyParams;

			if (!hasPermissionAsync(this.userId, 'manage-email-inbox')) {
				throw new Error('error-not-allowed');
			}
			const { _id, active, name, email, description, senderInfo, department, smtp, imap } = emailsInboxParams;
			if (!_id) {
				emailsInboxParams.ts = new Date();
				emailsInboxParams._createdBy = Users.findOne(this.userId, { fields: { username: 1 } });
				return EmailInbox.create(emailsInboxParams);
			}
			const updateEmailInbox = {
				$set: { },
			};

			const emailsInbox = Promise.await(findOneEmailsInbox({ userId: this.userId, id: _id }));

			if (!emailsInbox) {
				throw new Error('error-invalid-email-inbox');
			}

			updateEmailInbox.$set.active = active;
			updateEmailInbox.$set.name = name;
			updateEmailInbox.$set.email = email;
			updateEmailInbox.$set.description = description;
			updateEmailInbox.$set.senderInfo = senderInfo;
			updateEmailInbox.$set.department = department;
			updateEmailInbox.$set.smtp = smtp;
			updateEmailInbox.$set.imap = imap;
			EmailInbox.updateById(_id, updateEmailInbox);

			return API.v1.success({ _id });
		} catch (e) {
			return API.v1.failure(e);
		}
	},
	delete() {
		if (!hasPermissionAsync(this.userId, 'manage-email-inboxs')) {
			throw new Error('error-not-allowed');
		}
		try {
			check(this.queryParams, {
				_id: String,
			});

			const { _id } = this.queryParams;
			const emailsInbox = EmailInbox.findOneById(_id);

			if (!emailsInbox) {
				return API.v1.notFound();
			}
			EmailInbox.removeById(_id);
			return API.v1.success({ _id });
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});

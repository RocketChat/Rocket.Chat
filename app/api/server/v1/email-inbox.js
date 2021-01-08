import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

import { API } from '../api';
import { findEmailsInbox, findOneEmailsInbox, inserOneOrUpdateEmailInbox } from '../lib/emailInbox';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { EmailInbox } from '../../../models';

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

			const { _id } = emailsInboxParams;

			Promise.await(inserOneOrUpdateEmailInbox(this.userId, emailsInboxParams));

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

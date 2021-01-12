import { check, Match } from 'meteor/check';

import { API } from '../api';
import { findEmailInboxes, findOneEmailInbox, inserOneOrUpdateEmailInbox } from '../lib/emailInbox';
import { hasPermission } from '../../../authorization/server/functions/hasPermission';
import { EmailInbox } from '../../../models';

API.v1.addRoute('email-inbox.list', { authRequired: true }, {
	get() {
		try {
			const { offset, count } = this.getPaginationItems();
			const { sort, query } = this.parseJsonQuery();
			const emailInboxes = Promise.await(findEmailInboxes({ userId: this.userId, query, pagination: { offset, count, sort } }));
			return API.v1.success(emailInboxes);
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});

API.v1.addRoute('email-inbox', { authRequired: true }, {
	post() {
		try {
			if (!hasPermission(this.userId, 'manage-email-inbox')) {
				throw new Error('error-not-allowed');
			}
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

			const emailInboxParams = this.bodyParams;

			const { _id } = emailInboxParams;

			Promise.await(inserOneOrUpdateEmailInbox(this.userId, emailInboxParams));

			return API.v1.success({ _id });
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});

API.v1.addRoute('email-inbox/:_id', { authRequired: true }, {
	get() {
		try {
			check(this.urlParams, {
				_id: String,
			});

			const { _id } = this.urlParams;
			if (!_id) { throw new Error('error-invalid-params'); }
			const emailInboxes = Promise.await(findOneEmailInbox({ userId: this.userId, _id }));

			return API.v1.success(emailInboxes);
		} catch (e) {
			return API.v1.failure(e);
		}
	},
	delete() {
		try {
			if (!hasPermission(this.userId, 'manage-email-inbox')) {
				throw new Error('error-not-allowed');
			}
			check(this.urlParams, {
				_id: String,
			});

			const { _id } = this.urlParams;
			if (!_id) { throw new Error('error-invalid-params'); }

			const emailInboxes = EmailInbox.findOneById(_id);

			if (!emailInboxes) {
				return API.v1.notFound();
			}
			EmailInbox.removeById(_id);
			return API.v1.success({ _id });
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});

API.v1.addRoute('email-inbox.search', { authRequired: true }, {
	get() {
		try {
			if (!hasPermission(this.userId, 'manage-email-inbox')) {
				throw new Error('error-not-allowed');
			}
			check(this.queryParams, {
				email: String,
			});

			const { email } = this.queryParams;
			const emailInbox = Promise.await(EmailInbox.findOne({ email }));

			return API.v1.success({ emailInbox });
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});

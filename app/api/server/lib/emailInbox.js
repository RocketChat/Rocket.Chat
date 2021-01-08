import { EmailInbox } from '../../../models/server/raw';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { Users } from '../../../models';

export async function findEmailsInbox({ userId, query = {}, pagination: { offset, count, sort } }) {
	if (!await hasPermissionAsync(userId, 'manage-email-inbox')) {
		throw new Error('error-not-allowed');
	}
	const cursor = EmailInbox.find(query, {
		sort: sort || { name: 1 },
		skip: offset,
		limit: count,
	});

	const total = await cursor.count();

	const emailsInbox = await cursor.toArray();

	return {
		emailsInbox,
		count: emailsInbox.length,
		offset,
		total,
	};
}

export async function findOneEmailsInbox({ userId, _id }) {
	if (!hasPermissionAsync(userId, 'manage-email-inbox')) {
		throw new Error('error-not-allowed');
	}
	return EmailInbox.findOneById(_id);
}

export async function inserOneOrUpdateEmailInbox(userId, emailsInboxParams) {
	const { _id, active, name, email, description, senderInfo, department, smtp, imap } = emailsInboxParams;

	if (!_id) {
		emailsInboxParams.ts = new Date();
		emailsInboxParams._createdBy = Users.findOne(userId, { fields: { username: 1 } });
		return EmailInbox.insertOne(emailsInboxParams);
	}

	const emailsInbox = Promise.await(findOneEmailsInbox({ userId, id: _id }));

	if (!emailsInbox) {
		throw new Error('error-invalid-email-inbox');
	}

	const updateEmailInbox = {
		$set: { },
	};
	updateEmailInbox.$set.active = active;
	updateEmailInbox.$set.name = name;
	updateEmailInbox.$set.email = email;
	updateEmailInbox.$set.description = description;
	updateEmailInbox.$set.senderInfo = senderInfo;
	updateEmailInbox.$set.department = department;
	updateEmailInbox.$set.smtp = smtp;
	updateEmailInbox.$set.imap = imap;
	updateEmailInbox.$set.ts = emailsInbox.ts;
	updateEmailInbox.$set._createdBy = emailsInbox._createdBy;

	return EmailInbox.update({ _id }, updateEmailInbox);
}

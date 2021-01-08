import { EmailInbox } from '../../../models/server/raw';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { Users } from '../../../models';

export async function findEmailInboxes({ userId, query = {}, pagination: { offset, count, sort } }) {
	if (!await hasPermissionAsync(userId, 'manage-email-inbox')) {
		throw new Error('error-not-allowed');
	}
	const cursor = EmailInbox.find(query, {
		sort: sort || { name: 1 },
		skip: offset,
		limit: count,
	});

	const total = await cursor.count();

	const emailInboxes = await cursor.toArray();

	return {
		emailInboxes,
		count: emailInboxes.length,
		offset,
		total,
	};
}

export async function findOneEmailInbox({ userId, _id }) {
	if (!await hasPermissionAsync(userId, 'manage-email-inbox')) {
		throw new Error('error-not-allowed');
	}
	return EmailInbox.findOneById(_id);
}

export async function inserOneOrUpdateEmailInbox(userId, emailInboxParams) {
	const { _id, active, name, email, description, senderInfo, department, smtp, imap } = emailInboxParams;

	if (!_id) {
		emailInboxParams.ts = new Date();
		emailInboxParams._createdBy = Users.findOne(userId, { fields: { username: 1 } });
		return EmailInbox.insertOne(emailInboxParams);
	}

	const emailInboxes = await findOneEmailInbox({ userId, id: _id });

	if (!emailInboxes) {
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
	updateEmailInbox.$set.ts = emailInboxes.ts;
	updateEmailInbox.$set._createdBy = emailInboxes._createdBy;

	return EmailInbox.update({ _id }, updateEmailInbox);
}

export async function findOneEmailInboxByEmail({ userId, email }) {
	if (!await hasPermissionAsync(userId, 'manage-email-inbox')) {
		throw new Error('error-not-allowed');
	}
	return EmailInbox.findOne({ email });
}

export async function findOneDifferentEmailInboxByEmail({ userId, email, _id }) {
	if (!await hasPermissionAsync(userId, 'manage-email-inbox')) {
		throw new Error('error-not-allowed');
	}

	const existentEmail = await EmailInbox.findOne({ email });

	if (existentEmail && existentEmail._id === _id) {
		return;
	}

	return existentEmail;
}

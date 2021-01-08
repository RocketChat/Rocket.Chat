import { EmailInbox } from '../../../models/server/raw';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';

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

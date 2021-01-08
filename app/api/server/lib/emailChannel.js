import { EmailChannel } from '../../../models/server/raw';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';

export async function findEmailChannels({ userId, query = {}, pagination: { offset, count, sort } }) {
	if (!await hasPermissionAsync(userId, 'manage-email-channels')) {
		throw new Error('error-not-allowed');
	}
	const cursor = EmailChannel.find(query, {
		sort: sort || { name: 1 },
		skip: offset,
		limit: count,
	});

	const total = await cursor.count();

	const emailChannels = await cursor.toArray();

	return {
		emailChannels,
		count: emailChannels.length,
		offset,
		total,
	};
}

export async function findOneEmailChannel({ userId, _id }) {
	if (!hasPermissionAsync(userId, 'manage-email-channels')) {
		throw new Error('error-not-allowed');
	}
	return EmailChannel.findOneById(_id);
}

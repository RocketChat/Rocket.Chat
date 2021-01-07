import { EmailChannel as EmailChannelRaw } from '../../../models/server/raw';
import { EmailChannel, Users } from '../../../models';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';

export async function find({ userId, query = {}, pagination: { offset, count, sort } }) {
	if (!await hasPermissionAsync(userId, 'manage-email-channels')) {
		throw new Error('error-not-allowed');
	}
	const cursor = EmailChannelRaw.find(query, {
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

export async function findOne({ userId, id }) {
	if (!hasPermissionAsync(userId, 'manage-email-channels')) {
		throw new Error('error-not-allowed');
	}
	return EmailChannel.findOneById(id);
}

export async function createEdit(emailChannelParams, userId) {
	if (!hasPermissionAsync(userId, 'manage-email-channels')) {
		throw new Error('error-not-allowed');
	}

	const updateEmailChannel = {
		$set: { },
	};

	const { _id, active, name, email, description, senderInfo, department, smtp, imap } = emailChannelParams;

	if (!_id) {
		emailChannelParams.ts = new Date();
		emailChannelParams._createdBy = Users.findOne(this.userId, { fields: { username: 1 } });
		return EmailChannel.create(emailChannelParams);
	}

	updateEmailChannel.$set.active = active;
	updateEmailChannel.$set.name = name;
	updateEmailChannel.$set.email = email;
	updateEmailChannel.$set.description = description;
	updateEmailChannel.$set.senderInfo = senderInfo;
	updateEmailChannel.$set.department = department;
	updateEmailChannel.$set.smtp = smtp;
	updateEmailChannel.$set.imap = imap;

	EmailChannel.updateById(_id, updateEmailChannel);

	return _id;
}

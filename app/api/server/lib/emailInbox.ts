import { EmailInbox } from '../../../models/server/raw';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { Users } from '../../../models/server';
import { IEmailInbox } from '../../../../definition/IEmailInbox';
import { InsertionModel } from '../../../models/server/raw/BaseRaw';

export async function findEmailInboxes({
	userId,
	query = {},
	pagination: { offset, count, sort },
}: {
	userId: string;
	query: {};
	pagination: { offset: number; count: number; sort: undefined };
}): Promise<unknown> {
	if (!(await hasPermissionAsync(userId, 'manage-email-inbox'))) {
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

export async function findOneEmailInbox({ userId, _id }: { userId: string; _id: string }): Promise<unknown> {
	if (!(await hasPermissionAsync(userId, 'manage-email-inbox'))) {
		throw new Error('error-not-allowed');
	}
	return EmailInbox.findOneById(_id);
}

export async function insertOneOrUpdateEmailInbox(userId: string, emailInboxParams: InsertionModel<IEmailInbox>): Promise<unknown> {
	const { _id, active, name, email, description, senderInfo, department, smtp, imap } = emailInboxParams;

	if (!_id) {
		emailInboxParams._createdAt = new Date();
		emailInboxParams._updatedAt = new Date();
		emailInboxParams._createdBy = Users.findOne(userId, { fields: { username: 1 } });
		return EmailInbox.insertOne(emailInboxParams);
	}

	const emailInbox = await findOneEmailInbox({ userId, _id });

	if (!emailInbox) {
		throw new Error('error-invalid-email-inbox');
	}

	const updateEmailInbox = {
		$set: {
			active,
			name,
			email,
			description,
			senderInfo,
			smtp,
			imap,
			_updatedAt: new Date(),
			department,
		},
		$unset: {},
	};

	if (department === 'All') {
		updateEmailInbox.$unset = {
			department: 1,
		};
	} else {
		updateEmailInbox.$set.department = department;
	}

	return EmailInbox.updateOne({ _id }, updateEmailInbox);
}

export async function findOneEmailInboxByEmail({ userId, email }: { userId: string; email: string }): Promise<unknown> {
	if (!(await hasPermissionAsync(userId, 'manage-email-inbox'))) {
		throw new Error('error-not-allowed');
	}
	return EmailInbox.findOne({ email });
}

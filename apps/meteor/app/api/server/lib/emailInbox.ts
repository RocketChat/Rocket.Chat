import { EmailInbox } from '../../../models/server/raw';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { Users } from './../../../models/server';
import { IEmailInbox } from '@rocket.chat/core-typings';
import { InsertOneWriteOpResult, UpdateWriteOpResult, WithId } from 'mongodb';

export const findEmailInboxes = async ({
	userId,
	query = {},
	pagination: { offset, count, sort },
}: {
	userId: string;
	query?: {};
	pagination: {
		offset: number;
		count: number;
		sort?: {};
	};
}): Promise<{
	emailInboxes: IEmailInbox[];
	total: number;
	count: number;
	offset: number;
}> => {
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
};

export const findOneEmailInbox = async ({ userId, _id }: { userId: string; _id: string }): Promise<IEmailInbox | null> => {
	if (!(await hasPermissionAsync(userId, 'manage-email-inbox'))) {
		throw new Error('error-not-allowed');
	}
	return EmailInbox.findOneById(_id);
};

export const insertOneOrUpdateEmailInbox = async (
	userId: string,
	emailInboxParams: IEmailInbox,
): Promise<InsertOneWriteOpResult<WithId<IEmailInbox>> | UpdateWriteOpResult> => {
	const { _id, active, name, email, description, senderInfo, department, smtp, imap } = emailInboxParams;

	if (!_id) {
		emailInboxParams._createdAt = new Date();
		emailInboxParams._updatedAt = new Date();
		emailInboxParams._createdBy = Users.findOne(userId, { fields: { username: 1 } });
		return EmailInbox.insertOne(emailInboxParams);
	}

	const emailInbox = await findOneEmailInbox({ userId, _id: _id });

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
			...(department !== 'All' && { department }),
		},
		...(department === 'All' && { $unset: { department: 1 as const } }),
	};

	return EmailInbox.updateOne({ _id }, updateEmailInbox);
};

export const findOneEmailInboxByEmail = async ({ userId, email }: { userId: string; email: string }): Promise<IEmailInbox | null> => {
	if (!(await hasPermissionAsync(userId, 'manage-email-inbox'))) {
		throw new Error('error-not-allowed');
	}
	return EmailInbox.findOne({ email });
};

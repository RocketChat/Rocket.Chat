import { IEmailInbox } from '@rocket.chat/core-typings';
import { InsertOneResult, UpdateResult, WithId } from 'mongodb';
import { EmailInbox } from '@rocket.chat/models';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { Users } from '../../../models/server';

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
	const { cursor, totalCount } = EmailInbox.findPaginated(query, {
		sort: sort || { name: 1 },
		skip: offset,
		limit: count,
	});

	const [emailInboxes, total] = await Promise.all([cursor.toArray(), totalCount]);

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
export const insertOneEmailInbox = async (
	userId: string,
	emailInboxParams: Pick<IEmailInbox, 'active' | 'name' | 'email' | 'description' | 'senderInfo' | 'department' | 'smtp' | 'imap'>,
): Promise<InsertOneResult<WithId<IEmailInbox>>> => {
	const obj = {
		...emailInboxParams,
		_createdAt: new Date(),
		_updatedAt: new Date(),
		_createdBy: Users.findOne(userId, { fields: { username: 1 } }),
	};
	return EmailInbox.insertOne(obj);
};

export const updateEmailInbox = async (
	userId: string,
	emailInboxParams: Pick<IEmailInbox, '_id' | 'active' | 'name' | 'email' | 'description' | 'senderInfo' | 'department' | 'smtp' | 'imap'>,
): Promise<InsertOneResult<WithId<IEmailInbox>> | UpdateResult> => {
	const { _id, active, name, email, description, senderInfo, department, smtp, imap } = emailInboxParams;

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

import type { IEmailInbox } from '@rocket.chat/core-typings';
import type { Filter, InsertOneResult, Sort, UpdateResult, WithId } from 'mongodb';
import { EmailInbox } from '@rocket.chat/models';

import { Users } from '../../../models/server';

export const findEmailInboxes = async ({
	query = {},
	pagination: { offset, count, sort },
}: {
	query?: Filter<IEmailInbox>;
	pagination: {
		offset: number;
		count: number;
		sort?: Sort;
	};
}): Promise<{
	emailInboxes: IEmailInbox[];
	total: number;
	count: number;
	offset: number;
}> => {
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

export const findOneEmailInbox = async ({ _id }: { _id: string }): Promise<IEmailInbox | null> => {
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
	emailInboxParams: Pick<IEmailInbox, '_id' | 'active' | 'name' | 'email' | 'description' | 'senderInfo' | 'department' | 'smtp' | 'imap'>,
): Promise<InsertOneResult<WithId<IEmailInbox>> | UpdateResult> => {
	const { _id, active, name, email, description, senderInfo, department, smtp, imap } = emailInboxParams;

	const emailInbox = await findOneEmailInbox({ _id });

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

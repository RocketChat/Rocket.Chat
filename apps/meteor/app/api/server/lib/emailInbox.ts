import type { IEmailInbox } from '@rocket.chat/core-typings';
import { EmailInbox, Users } from '@rocket.chat/models';
import type { DeleteResult, Filter, InsertOneResult, Sort } from 'mongodb';

import { notifyOnEmailInboxChanged } from '../../../lib/server/lib/notifyListener';

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

export const insertOneEmailInbox = async (
	userId: string,
	emailInboxParams: Pick<IEmailInbox, 'active' | 'name' | 'email' | 'description' | 'senderInfo' | 'department' | 'smtp' | 'imap'>,
): Promise<InsertOneResult<IEmailInbox>> => {
	const obj = {
		...emailInboxParams,
		_createdAt: new Date(),
		_updatedAt: new Date(),
		_createdBy: await Users.findOneById(userId, { projection: { username: 1 } }),
	};

	const response = await EmailInbox.create(obj);

	if (response.insertedId) {
		void notifyOnEmailInboxChanged({ _id: response.insertedId, ...obj }, 'inserted');
	}

	return response;
};

export const updateEmailInbox = async (
	emailInboxParams: Pick<IEmailInbox, '_id' | 'active' | 'name' | 'email' | 'description' | 'senderInfo' | 'department' | 'smtp' | 'imap'>,
): Promise<Pick<IEmailInbox, '_id'> | null> => {
	const { _id, active, name, email, description, senderInfo, department, smtp, imap } = emailInboxParams;

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

	const updatedResponse = await EmailInbox.updateById(_id, updateEmailInbox);

	if (!updatedResponse) {
		throw new Error('error-invalid-email-inbox');
	}

	void notifyOnEmailInboxChanged(
		{
			...updatedResponse,
			...(department === 'All' && { department: undefined }),
		},
		'updated',
	);

	return updatedResponse;
};

export const removeEmailInbox = async (emailInboxId: IEmailInbox['_id']): Promise<DeleteResult> => {
	const removeResponse = await EmailInbox.removeById(emailInboxId);

	if (removeResponse.deletedCount) {
		void notifyOnEmailInboxChanged({ _id: emailInboxId }, 'removed');
	}

	return removeResponse;
};

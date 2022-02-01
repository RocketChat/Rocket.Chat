import { IPagination } from '../../../../../ee/app/livechat-enterprise/server/api/lib/definition';
import { ILivechatTrigger } from '../../../../../definition/ILivechatTrigger';
import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { LivechatTrigger } from '../../../../models/server/raw';

export async function findTriggers({
	userId,
	pagination,
}: {
	userId: string;
	pagination: IPagination;
}): Promise<ILivechatTrigger[] | number | any> {
	if (!(await hasPermissionAsync(userId, 'view-livechat-manager'))) {
		throw new Error('error-not-authorized');
	}

	const { offset } = pagination;

	const cursor = await LivechatTrigger.find(
		{},
		{
			sort: pagination.sort || { name: 1 },
			skip: pagination.offset,
			limit: pagination.count,
		},
	);

	const total = await cursor.count();

	const triggers = await cursor.toArray();

	return {
		triggers,
		count: triggers.length,
		offset,
		total,
	};
}

export async function findTriggerById({ userId, triggerId }: { userId: string; triggerId: string }): Promise<ILivechatTrigger | null> {
	if (!(await hasPermissionAsync(userId, 'view-livechat-manager'))) {
		throw new Error('error-not-authorized');
	}

	return LivechatTrigger.findOneById(triggerId);
}

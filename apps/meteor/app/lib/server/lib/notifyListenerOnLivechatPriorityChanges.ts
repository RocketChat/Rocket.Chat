import { api, dbWatchersDisabled } from '@rocket.chat/core-services';
import type { ILivechatPriority } from '@rocket.chat/core-typings';
import { LivechatPriority } from '@rocket.chat/models';

type ClientAction = 'updated';

export async function notifyListenerOnLivechatPriorityChanges(
	lpid: ILivechatPriority['_id'],
	clientAction: ClientAction = 'updated',
	existingPriorityData?: ILivechatPriority,
): Promise<void> {
	if (!dbWatchersDisabled) {
		return;
	}

	const priority = existingPriorityData || (await LivechatPriority.findOneById(lpid));

	if (priority) {
		void api.broadcast('watch.priorities', {
			clientAction,
			data: priority,
			id: lpid,
			diff: { name: priority.name || '' },
		});
	}
}

export async function notifyListenerOnLivechatPrioritiesChanges(priorities: ILivechatPriority[], clientAction: ClientAction = 'updated') {
	if (!dbWatchersDisabled || !priorities.length) {
		return;
	}

	void notifyListenerOnLivechatPriorityChanges(priorities[0]._id, clientAction, priorities[0]);

	return notifyListenerOnLivechatPrioritiesChanges(priorities.slice(1), clientAction);
}

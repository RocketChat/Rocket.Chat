import { settings } from '../../../settings';
import { Tasks, Rooms } from '../../../models';
import { normalizeTasksForUsers } from '../../../utils/server/lib/normalizeTasksForUsers';

const hideMessagesOfTypeServer = new Set();

settings.get('Hide_System_Messages', function(key, values) {
	const hiddenTypes = values.reduce((array, value) => [...array, ...value === 'mute_unmute' ? ['user-muted', 'user-unmuted'] : [value]], []);
	hideMessagesOfTypeServer.clear();
	hiddenTypes.forEach((item) => hideMessagesOfTypeServer.add(item));
});

export const loadTaskHistory = function loadTaskHistory({ userId, rid, end, limit = 20, ls, showThreadMessages = true }) {
	const room = Rooms.findOne(rid, { fields: { sysMes: 1 } });

	const hiddenMessageTypes = Array.isArray(room && room.sysMes) ? room.sysMes : Array.from(hideMessagesOfTypeServer.values()); // TODO probably remove on chained event system
	const options = {
		sort: {
			ts: -1,
		},
		limit,
	};

	const records = end != null
		? Tasks.findVisibleByRoomIdBeforeTimestampNotContainingTypes(
			rid,
			end,
			hiddenMessageTypes,
			options,
			showThreadMessages,
		).fetch()
		: Tasks.findVisibleByRoomIdNotContainingTypes(
			rid,
			hiddenMessageTypes,
			options,
			showThreadMessages,
		).fetch();
	const tasks = normalizeTasksForUsers(records, userId);
	let unreadNotLoaded = 0;
	let firstUnread;

	if (ls != null) {
		const firstMessage = tasks[tasks.length - 1];

		if ((firstMessage != null ? firstMessage.ts : undefined) > ls) {
			delete options.limit;
			const unreadTasks = Tasks.findVisibleByRoomIdBetweenTimestampsNotContainingTypes(
				rid,
				ls,
				firstMessage.ts,
				hiddenMessageTypes,
				{
					limit: 1,
					sort: {
						ts: 1,
					},
				},
				showThreadMessages,
			);

			firstUnread = unreadTasks.fetch()[0];
			unreadNotLoaded = unreadTasks.count();
		}
	}

	return {
		tasks,
		firstUnread,
		unreadNotLoaded,
	};
};

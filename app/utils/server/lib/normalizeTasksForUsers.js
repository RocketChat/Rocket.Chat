import { Users } from '../../../models/server';
import { settings } from '../../../settings/server';

const filterStarred = (task, uid) => {
	// only return starred field if user has it starred
	if (task.starred && Array.isArray(task.starred)) {
		task.starred = task.starred.filter((star) => star._id === uid);
	}
	return task;
};

// TODO: we should let clients get user names on demand instead of doing this

function getNameOfUsername(users, username) {
	return users.get(username) || username;
}

export const normalizeTasksForUser = (tasks, uid) => {
	// if not using real names, there is nothing else to do
	if (!settings.get('UI_Use_Real_Name')) {
		return tasks.map((tasks) => filterStarred(tasks, uid));
	}

	const usernames = new Set();

	tasks.forEach((message) => {
		message = filterStarred(message, uid);

		if (!message.u || !message.u.username) {
			return;
		}
		usernames.add(message.u.username);

		(message.mentions || []).forEach(({ username }) => { usernames.add(username); });

		Object.values(message.reactions || {})
			.forEach((reaction) => reaction.usernames.forEach((username) => usernames.add(username)));
	});

	const names = new Map();

	Users.findUsersByUsernames([...usernames.values()], {
		fields: {
			username: 1,
			name: 1,
		},
	}).forEach((user) => {
		names.set(user.username, user.name);
	});

	tasks.forEach((task) => {
		if (!task.u) {
			return;
		}
		task.u.name = getNameOfUsername(names, task.u.username);

		(task.mentions || []).forEach((mention) => { mention.name = getNameOfUsername(names, mention.username); });

		Object.keys(task.reactions || {}).forEach((reaction) => {
			task.reactions[reaction].names = task.reactions[reaction].usernames.map((username) => getNameOfUsername(names, username));
		});
	});

	return tasks;
};

import { setUsername } from './setUsername';
import { setRealName } from './setRealName';
import { Messages, Rooms, Subscriptions, LivechatDepartmentAgents, Users } from '../../../models/server';
import { FileUpload } from '../../../file-upload/server';

const getFname = (members) => members.map(({ name, username }) => name || username).join(', ');
const getName = (members) => members.map(({ username }) => username).join(',');

const updateGroupDMsName = (user) => {
	const userIds = new Set();
	const users = new Map([[user._id, user]]);

	const rooms = Rooms.findGroupDMsByUids(user._id, { fields: { uids: 1 } });

	if (rooms.count() === 0) {
		return;
	}

	// add all users to single array so we can fetch details from them all at once
	rooms.forEach((room) => room.uids.forEach((uid) => uid !== user._id && userIds.add(uid)));

	Users.findByIds([...userIds], { fields: { username: 1, name: 1 } })
		.forEach((user) => users.set(user._id, user));

	const getMembers = (uids) => uids.map((uid) => users.get(uid));

	// loop rooms to update the subcriptions from them all
	rooms.forEach((room) => {
		const members = getMembers(room.uids);
		const sortedMembers = members.sort((u1, u2) => (u1.name || u1.username).localeCompare(u2.name || u2.username));

		const subs = Subscriptions.findByRoomId(room._id, { fields: { _id: 1, 'u._id': 1 } });
		subs.forEach((sub) => {
			const otherMembers = sortedMembers.filter(({ _id }) => _id !== sub.u._id);

			Subscriptions.updateNameAndFnameById(sub._id, getName(otherMembers), getFname(otherMembers));
		});
	});
};

/**
 *
 * @param {string} userId user performing the action
 * @param {object} changes changes to the user
 */
export function saveUserIdentity(userId, { _id, name, username }) {
	if (!_id) {
		return false;
	}

	const user = Users.findOneById(_id);

	const previousUsername = user.username;

	if (username) {
		setUsername(_id, username, user);
		user.username = username;
	}

	if (name) {
		setRealName(_id, name, user);
	}

	// Username is available; if coming from old username, update all references
	if (previousUsername && username) {
		Messages.updateAllUsernamesByUserId(user._id, username);
		Messages.updateUsernameOfEditByUserId(user._id, username);
		Messages.findByMention(previousUsername).forEach(function(msg) {
			const updatedMsg = msg.msg.replace(new RegExp(`@${ previousUsername }`, 'ig'), `@${ username }`);
			return Messages.updateUsernameAndMessageOfMentionByIdAndOldUsername(msg._id, previousUsername, username, updatedMsg);
		});
		Rooms.replaceUsername(previousUsername, username);
		Rooms.replaceMutedUsername(previousUsername, username);
		Rooms.replaceUsernameOfUserByUserId(user._id, username);
		Subscriptions.setUserUsernameByUserId(user._id, username);

		LivechatDepartmentAgents.replaceUsernameOfAgentByUserId(user._id, username);

		const fileStore = FileUpload.getStore('Avatars');
		const file = fileStore.model.findOneByName(previousUsername);
		if (file) {
			fileStore.model.updateFileNameById(file._id, username);
		}
	}

	// update name and fname of 1-on-1 direct messages
	Subscriptions.updateDirectNameAndFnameByName(previousUsername, username, name);

	// update name and fname of group direct messages
	updateGroupDMsName(user);

	return true;
}

import { callbacks } from '../../../callbacks';
import { settings } from '../../../settings';
import { sendMessage } from '../../../lib';
import { LivechatDepartment, Rooms, Users } from '../../../models';

callbacks.add('livechat.offlineMessage', (data) => {
	if (!settings.get('Livechat_OfflineMessageToChannel_enabled')) {
		return data;
	}

	let channelName = settings.get('Livechat_OfflineMessageToChannel_channel_name');
	let departmentName;
	const { name, email, department, message: text } = data;
	if (department && department !== '') {
		const dept = LivechatDepartment.findOneById(department, { fields: { name: 1, offlineMessageChannelName: 1 } });
		departmentName = dept?.name;
		if (dept?.offlineMessageChannelName) {
			channelName = dept.offlineMessageChannelName;
		}
	}

	if (!channelName || channelName === '') {
		return data;
	}

	const room = Rooms.findOneByName(channelName, { fields: { t: 1, archived: 1 } });
	if (!room || room.archived || room.closedAt) {
		return data;
	}

	const user = Users.findOneById('rocket.cat', { fields: { username: 1 } });
	if (!user) {
		return data;
	}

	let msg = 'A new Livechat Offline Message has been sent: \n';
	msg = msg.concat(`Visitor Name: ${ name } \n`);
	msg = msg.concat(`Visitor Email: ${ email } \n`);
	if (departmentName) {
		msg = msg.concat(`Department: ${ departmentName } \n`);
	}
	msg = msg.concat(`Message: ${ text } \n`);

	const message = {
		rid: room._id,
		msg,
		groupable: false,
	};

	sendMessage(user, message, room, true);
}, callbacks.priority.MEDIUM, 'livechat-send-email-offline-message-to-channel');

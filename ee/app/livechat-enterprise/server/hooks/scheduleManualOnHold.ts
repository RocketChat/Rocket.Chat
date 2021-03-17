import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../../../app/callbacks/server';
import { settings } from '../../../../../app/settings/server';
import { AutoCloseOnHoldScheduler } from '../lib/AutoCloseOnHoldScheduler';
import { ManualOnHoldChatScheduler } from '../lib/ManualOnHoldScheduler';

let manualOnHoldTimeout = -1;
let manualOnHoldEnabled = false;

const handleAfterSaveMessage = async (message: any = {}, room: any = {}): Promise<any> => {
	const { _id: rid, onHold } = room;
	if (!rid) {
		return message;
	}

	// skips this callback if the message was edited
	if (message.editedAt) {
		return message;
	}
	// message valid only if it is a livechat room
	if (!(typeof room.t !== 'undefined' && room.t === 'l' && room.v && room.v.token)) {
		return message;
	}
	// if the message has a type means it is a special message (like the closing comment), so skips
	if (message.t) {
		return message;
	}

	// TODO: find a better place to add this
	if (message.token && onHold) {
		await AutoCloseOnHoldScheduler.unscheduleRoom(rid);
		await Meteor.call('livechat:resumeOnHold', room._id, { clientAction: false });
		return message;
	}

	if (!manualOnHoldEnabled || manualOnHoldTimeout < 0) {
		return message;
	}

	message.token ? await ManualOnHoldChatScheduler.unscheduleRoom(rid) : await ManualOnHoldChatScheduler.scheduleRoom(rid, manualOnHoldTimeout === 0 ? 2 : manualOnHoldTimeout);

	return message;
};


settings.get('Livechat_allow_manual_on_hold', (_, value) => {
	manualOnHoldEnabled = value as boolean;
	if (!manualOnHoldEnabled) {
		callbacks.remove('afterSaveMessage', 'livechat-manual-on-hold');
		return;
	}

	callbacks.add('afterSaveMessage', handleAfterSaveMessage, callbacks.priority.HIGH, 'livechat-manual-on-hold');
});


settings.get('Livechat_manual_on_hold_timeout', (_, value) => {
	manualOnHoldTimeout = value as number ? value as number : -1;
});

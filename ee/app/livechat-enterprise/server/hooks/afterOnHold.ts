import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { callbacks } from '../../../../../app/callbacks/server';
import { settings } from '../../../../../app/settings/server';
import { AutoCloseOnHoldScheduler } from '../lib/AutoCloseOnHoldScheduler';


const DEFAULT_CLOSED_MESSAGE = TAPi18n.__('Closed_automatically');

let autoCloseOnHoldChatTimeout = 0;
let customCloseMessage = DEFAULT_CLOSED_MESSAGE;

const handleAfterOnHold = async (room: any = {}): Promise<any> => {
	const { _id: rid } = room;
	if (!rid) {
		return;
	}

	if (!autoCloseOnHoldChatTimeout || autoCloseOnHoldChatTimeout <= 0) {
		return;
	}

	await AutoCloseOnHoldScheduler.scheduleRoom(room._id, autoCloseOnHoldChatTimeout, customCloseMessage);
};

settings.get('Livechat_auto_close_on_hold_chats_timeout', (_, value) => {
	autoCloseOnHoldChatTimeout = value as number;
	if (!value || value <= 0) {
		callbacks.remove('livechat:afterOnHold', 'livechat-auto-close-on-hold');
	}
	callbacks.add('livechat:afterOnHold', handleAfterOnHold, callbacks.priority.HIGH, 'livechat-auto-close-on-hold');
});

settings.get('Livechat_auto_close_on_hold_chats_custom_message', (_, value) => {
	customCloseMessage = value as string || DEFAULT_CLOSED_MESSAGE;
});

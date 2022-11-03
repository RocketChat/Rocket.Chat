import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { callbacks } from '../../../../../lib/callbacks';
import { settings } from '../../../../../app/settings/server';
import { AutoCloseOnHoldScheduler } from '../lib/AutoCloseOnHoldScheduler';
import { cbLogger } from '../lib/logger';

const DEFAULT_CLOSED_MESSAGE = TAPi18n.__('Closed_automatically');

let autoCloseOnHoldChatTimeout = 0;
let customCloseMessage = DEFAULT_CLOSED_MESSAGE;

const handleAfterOnHold = async (room: any = {}): Promise<any> => {
	const { _id: rid } = room;
	if (!rid) {
		cbLogger.debug('Skipping callback. No room provided');
		return;
	}

	if (!autoCloseOnHoldChatTimeout || autoCloseOnHoldChatTimeout <= 0) {
		cbLogger.debug('Skipping callback. Autoclose on hold disabled by setting');
		return;
	}

	cbLogger.debug(`Scheduling room ${rid} to be closed in ${autoCloseOnHoldChatTimeout} seconds`);
	await AutoCloseOnHoldScheduler.scheduleRoom(room._id, autoCloseOnHoldChatTimeout, customCloseMessage);
};

settings.watch('Livechat_auto_close_on_hold_chats_timeout', (value) => {
	autoCloseOnHoldChatTimeout = value as number;
	if (!value || value <= 0) {
		callbacks.remove('livechat:afterOnHold', 'livechat-auto-close-on-hold');
	}
	callbacks.add('livechat:afterOnHold', handleAfterOnHold, callbacks.priority.HIGH, 'livechat-auto-close-on-hold');
});

settings.watch('Livechat_auto_close_on_hold_chats_custom_message', (value) => {
	customCloseMessage = (value as string) || DEFAULT_CLOSED_MESSAGE;
});

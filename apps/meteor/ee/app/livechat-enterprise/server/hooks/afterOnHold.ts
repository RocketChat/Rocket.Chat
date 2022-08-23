import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { callbacks } from '../../../../../lib/callbacks';
import { settings } from '../../../../../app/settings/server';
import { cbLogger } from '../lib/logger';
import { OmniEEService } from '../../../../server/sdk';

let autoCloseOnHoldChatTimeout = 0;

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
	await OmniEEService.monitorOnHoldRoomForAutoClose(
		room._id,
		autoCloseOnHoldChatTimeout,
		settings.get('Livechat_auto_close_on_hold_chats_custom_message') ||
			TAPi18n.__('Closed_automatically_because_chat_was_onhold_for_seconds', {
				onHoldTime: autoCloseOnHoldChatTimeout,
			}),
	);
};

settings.watch('Livechat_auto_close_on_hold_chats_timeout', (value) => {
	autoCloseOnHoldChatTimeout = value as number;
	if (!value || value <= 0) {
		callbacks.remove('livechat:afterOnHold', 'livechat-auto-close-on-hold');
	}
	callbacks.add('livechat:afterOnHold', handleAfterOnHold, callbacks.priority.HIGH, 'livechat-auto-close-on-hold');
});

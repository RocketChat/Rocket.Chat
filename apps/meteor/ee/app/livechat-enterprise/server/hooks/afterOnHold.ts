import type { IOmnichannelRoom } from '@rocket.chat/core-typings';

import { settings } from '../../../../../app/settings/server';
import { callbacks } from '../../../../../lib/callbacks';
import { i18n } from '../../../../../server/lib/i18n';
import { AutoCloseOnHoldScheduler } from '../lib/AutoCloseOnHoldScheduler';
import { cbLogger } from '../lib/logger';

let autoCloseOnHoldChatTimeout = 0;

const handleAfterOnHold = async (room: Pick<IOmnichannelRoom, '_id'>): Promise<any> => {
	const { _id: rid } = room;
	if (!rid) {
		return;
	}

	if (!autoCloseOnHoldChatTimeout || autoCloseOnHoldChatTimeout <= 0) {
		return;
	}

	cbLogger.debug(`Scheduling room ${rid} to be closed in ${autoCloseOnHoldChatTimeout} seconds`);
	const closeComment =
		settings.get<string>('Livechat_auto_close_on_hold_chats_custom_message') ||
		i18n.t('Closed_automatically_because_chat_was_onhold_for_seconds', {
			onHoldTime: autoCloseOnHoldChatTimeout,
		});
	await AutoCloseOnHoldScheduler.scheduleRoom(rid, autoCloseOnHoldChatTimeout, closeComment);
};

settings.watch<number>('Livechat_auto_close_on_hold_chats_timeout', (value) => {
	autoCloseOnHoldChatTimeout = value as number;
	if (!value || value <= 0) {
		callbacks.remove('livechat:afterOnHold', 'livechat-auto-close-on-hold');
	}
	callbacks.add('livechat:afterOnHold', handleAfterOnHold, callbacks.priority.HIGH, 'livechat-auto-close-on-hold');
});

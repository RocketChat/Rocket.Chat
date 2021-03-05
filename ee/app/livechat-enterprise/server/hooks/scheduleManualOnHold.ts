import { callbacks } from '../../../../../app/callbacks/server';
import { settings } from '../../../../../app/settings/server';
import { AutoCloseOnHoldScheduler } from '../lib/AutoCloseOnHoldScheduler';
import { OnHoldChatScheduler } from '../lib/OnHoldScheduler';
import { LivechatRooms, Subscriptions } from '../../../../../app/models/server';

let manualOnHoldTimeout = -1;
let manualOnHoldEnabled = false;

const handleAfterSaveMessage = async (message: any = {}, room: any = {}): Promise<any> => {
	const { _id: rid } = room;
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
	if (message.token) {
		await AutoCloseOnHoldScheduler.unscheduleRoom(rid);
		let resp = (LivechatRooms as any).unsetIsChatOnHold(rid);
		console.log('----handleAfterSaveMessage rooms db response', resp);
		resp = Subscriptions.unsetIsChatOnHold(rid);
		console.log('----handleAfterSaveMessage subscription db response', resp);
	}

	if (!manualOnHoldEnabled || manualOnHoldTimeout < 0) {
		return message;
	}

	switch (!!message.token) {
		case true: {
			// message sent by visitor
			console.log('---cancelling all job', rid);
			await OnHoldChatScheduler.unscheduleRoom(rid);
			break;
		}
		case false: {
			// message sent by agent
			console.log('---scheduling job', rid);
			await OnHoldChatScheduler.scheduleRoom(rid, manualOnHoldTimeout === 0 ? 2 : manualOnHoldTimeout);
			break;
		}
	}

	return message;
};


settings.get('Livechat_allow_manual_on_hold', (_, value) => {
	console.log('---setting allow manual onhold called', value);
	manualOnHoldEnabled = value as boolean;
	if (!manualOnHoldTimeout) {
		console.log('--removeing callback');
		callbacks.remove('afterSaveMessage', 'livechat-manual-on-hold');
		return;
	}

	console.log('--adding callback');
	callbacks.add('afterSaveMessage', handleAfterSaveMessage, callbacks.priority.HIGH, 'livechat-manual-on-hold');
});


settings.get('Livechat_manual_on_hold_timeout', (_, value) => {
	console.log('---setting Livechat_manual_on_hold_timeout called', value);
	manualOnHoldTimeout = value as number ? value as number : -1;
});

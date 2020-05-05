import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { t, APIClient } from '../../../utils/client';
import { modal } from './modal';

export const warnUserDeletionMayRemoveRooms = async function(userId, callbackFn, { warningKey, confirmButtonKey, closeOnConfirm = false, skipModalIfEmpty = false }) {
	let warningText = warningKey ? t(warningKey) : false;

	const { rooms: { remove, changeOwner } } = await APIClient.v1.get('users.getSingleOwnedRooms', { userId });

	if (remove.length + changeOwner.length === 0 && skipModalIfEmpty) {
		callbackFn();
		return;
	}

	if (changeOwner.length > 0) {
		let newText;

		if (changeOwner.length === 1) {
			newText = TAPi18n.__('A_new_owner_will_be_assigned_automatically_to_the__roomName__room', { roomName: changeOwner.pop() });
		} else if (changeOwner.length <= 5) {
			newText = TAPi18n.__('A_new_owner_will_be_assigned_automatically_to_those__count__rooms__rooms__', { count: changeOwner.length, rooms: changeOwner.join(', ') });
		} else {
			newText = TAPi18n.__('A_new_owner_will_be_assigned_automatically_to__count__rooms', { count: changeOwner.length });
		}

		if (warningText) {
			warningText = `${ warningText }<p>&nbsp;</p><p>${ newText }</p>`;
		} else {
			warningText = newText;
		}
	}

	if (remove.length > 0) {
		let newText;

		if (remove.length === 1) {
			newText = TAPi18n.__('The_empty_room__roomName__will_be_removed_automatically', { roomName: remove.pop() });
		} else if (remove.length <= 5) {
			newText = TAPi18n.__('__count__empty_rooms_will_be_removed_automatically__rooms__', { count: remove.length, rooms: remove.join(', ') });
		} else {
			newText = TAPi18n.__('__count__empty_rooms_will_be_removed_automatically', { count: remove.length });
		}

		if (warningText) {
			warningText = `${ warningText }<p>&nbsp;</p><p>${ newText }</p>`;
		} else {
			warningText = newText;
		}
	}

	modal.open({
		title: t('Are_you_sure'),
		text: warningText,
		type: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#DD6B55',
		confirmButtonText: t(confirmButtonKey || 'Yes_delete_it'),
		cancelButtonText: t('Cancel'),
		closeOnConfirm,
		html: true,
	}, () => {
		callbackFn();
	});
};

import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { t } from '../../../utils/client';
import { modal } from './modal';

export const warnUserDeletionMayRemoveRooms = async function(userId, callbackFn, { warningKey, confirmButtonKey, closeOnConfirm = false, skipModalIfEmpty = false, shouldChangeOwner, shouldBeRemoved }) {
	let warningText = warningKey ? t(warningKey) : false;

	if (shouldBeRemoved.length + shouldChangeOwner.length === 0 && skipModalIfEmpty) {
		callbackFn();
		return;
	}

	if (shouldChangeOwner.length > 0) {
		let newText;

		if (shouldChangeOwner.length === 1) {
			newText = TAPi18n.__('A_new_owner_will_be_assigned_automatically_to_the__roomName__room', { roomName: shouldChangeOwner.pop() });
		} else if (shouldChangeOwner.length <= 5) {
			newText = TAPi18n.__('A_new_owner_will_be_assigned_automatically_to_those__count__rooms__rooms__', { count: shouldChangeOwner.length, rooms: shouldChangeOwner.join(', ') });
		} else {
			newText = TAPi18n.__('A_new_owner_will_be_assigned_automatically_to__count__rooms', { count: shouldChangeOwner.length });
		}

		if (warningText) {
			warningText = `${ warningText }<p>&nbsp;</p><p>${ newText }</p>`;
		} else {
			warningText = newText;
		}
	}

	if (shouldBeRemoved.length > 0) {
		let newText;

		if (shouldBeRemoved.length === 1) {
			newText = TAPi18n.__('The_empty_room__roomName__will_be_removed_automatically', { roomName: shouldBeRemoved.pop() });
		} else if (shouldBeRemoved.length <= 5) {
			newText = TAPi18n.__('__count__empty_rooms_will_be_removed_automatically__rooms__', { count: shouldBeRemoved.length, rooms: shouldBeRemoved.join(', ') });
		} else {
			newText = TAPi18n.__('__count__empty_rooms_will_be_removed_automatically', { count: shouldBeRemoved.length });
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

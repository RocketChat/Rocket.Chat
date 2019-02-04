import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import { t, UiTextContext, roomTypes, handleError } from 'meteor/rocketchat:utils';
import { modal } from './modal';
import { call } from './callMethod';

export function hide(type, rid, name) {
	const warnText = roomTypes.roomTypes[type].getUiText(UiTextContext.HIDE_WARNING);

	modal.open({
		title: t('Are_you_sure'),
		text: warnText ? t(warnText, name) : '',
		type: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#DD6B55',
		confirmButtonText: t('Yes_hide_it'),
		cancelButtonText: t('Cancel'),
		closeOnConfirm: true,
		dontAskAgain: {
			action: 'hideRoom',
			label: t('Hide_room'),
		},
		html: false,
	}, async function() {
		if (['channel', 'group', 'direct'].includes(FlowRouter.getRouteName()) && (Session.get('openedRoom') === rid)) {
			FlowRouter.go('home');
		}

		await call('hideRoom', rid);
		if (rid === Session.get('openedRoom')) {
			Session.delete('openedRoom');
		}
	});
	return false;
}

export async function leave(type, rid, name) {
	const { RoomManager } = await import('meteor/rocketchat:ui');
	const warnText = roomTypes.roomTypes[type].getUiText(UiTextContext.LEAVE_WARNING);

	modal.open({
		title: t('Are_you_sure'),
		text: warnText ? t(warnText, name) : '',
		type: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#DD6B55',
		confirmButtonText: t('Yes_leave_it'),
		cancelButtonText: t('Cancel'),
		closeOnConfirm: false,
		html: false,
	}, async function(isConfirm) {
		if (!isConfirm) {
			return;
		}
		try {
			await call('leaveRoom', rid);
			modal.close();
			if (['channel', 'group', 'direct'].includes(FlowRouter.getRouteName()) && (Session.get('openedRoom') === rid)) {
				FlowRouter.go('home');
			}
			RoomManager.close(rid);
		} catch (error) {
			return modal.open({
				type: 'error',
				title: t('Warning'),
				text: handleError(error, false),
				html: false,
			});
		}
	});
}

export function erase(rid) {
	modal.open({
		title: t('Are_you_sure'),
		text: t('Delete_Room_Warning'),
		type: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#DD6B55',
		confirmButtonText: t('Yes_delete_it'),
		cancelButtonText: t('Cancel'),
		closeOnConfirm: false,
		html: false,
	}, async() => {
		await call('eraseRoom', rid);
		modal.open({
			title: t('Deleted'),
			text: t('Room_has_been_deleted'),
			type: 'success',
			timer: 2000,
			showConfirmButton: false,
		});
	});
}

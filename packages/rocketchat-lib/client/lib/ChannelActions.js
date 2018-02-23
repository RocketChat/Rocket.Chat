import { call, UiTextContext } from 'meteor/rocketchat:lib';

export function hide(type, rid, name) {
	const warnText = RocketChat.roomTypes.roomTypes[type].getUiText(UiTextContext.HIDE_WARNING);

	modal.open({
		title: t('Are_you_sure'),
		text: warnText ? t(warnText, name) : '',
		type: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#DD6B55',
		confirmButtonText: t('Yes'),
		cancelButtonText: t('Cancel'),
		closeOnConfirm: true,
		html: false
	}, function() {
		if (['channel', 'group', 'direct'].includes(FlowRouter.getRouteName()) && (Session.get('openedRoom') === rid)) {
			FlowRouter.go('home');
		}

		Meteor.call('hideRoom', rid, function(err) {
			if (err) {
				handleError(err);
			} else if (rid === Session.get('openedRoom')) {
				Session.delete('openedRoom');
			}
		});
	});

	return false;
}

export function leave(type, rid, name) {
	const warnText = RocketChat.roomTypes.roomTypes[type].getUiText(UiTextContext.LEAVE_WARNING);

	modal.open({
		title: t('Are_you_sure'),
		text: warnText ? t(warnText, name) : '',
		type: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#DD6B55',
		confirmButtonText: t('Yes'),
		cancelButtonText: t('Cancel'),
		closeOnConfirm: false,
		html: false
	}, function(isConfirm) {
		if (isConfirm) {
			Meteor.call('leaveRoom', rid, function(err) {
				if (err) {
					modal.open({
						title: t('Warning'),
						text: handleError(err, false),
						type: 'warning',
						html: false
					});
				} else {
					modal.close();
					if (['channel', 'group', 'direct'].includes(FlowRouter.getRouteName()) && (Session.get('openedRoom') === rid)) {
						FlowRouter.go('home');
					}

					RoomManager.close(rid);
				}
			});
		}
	});

	return false;
}

export function erase(rid) {
	modal.open({
		title: t('Are_you_sure'),
		text: t('Delete_Room_Warning'),
		type: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#DD6B55',
		confirmButtonText: t('Yes'),
		cancelButtonText: t('Cancel'),
		closeOnConfirm: false,
		html: false
	}, () => {
		call('eraseRoom', rid).then(() => {
			modal.open({
				title: t('Deleted'),
				text: t('Room_has_been_deleted'),
				type: 'success',
				timer: 2000,
				showConfirmButton: false
			});
		});
	});
}

import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import { TAPi18n } from 'meteor/tap:i18n';
import toastr from 'toastr';
import _ from 'underscore';

import { WebRTC } from '../../../webrtc/client';
import { ChatRoom, ChatSubscription, RoomRoles, Subscriptions } from '../../../models';
import { modal } from '../../../ui-utils';
import { t, handleError, roomTypes } from '../../../utils';
import { settings } from '../../../settings';
import { hasPermission, hasAllPermission, hasRole, userHasAllPermission } from '../../../authorization';

const canSetLeader = () => hasAllPermission('set-leader', Session.get('openedRoom'));

const canSetOwner = () => hasAllPermission('set-owner', Session.get('openedRoom'));

const canSetModerator = () => hasAllPermission('set-moderator', Session.get('openedRoom'));

const canMuteUser = () => hasAllPermission('mute-user', Session.get('openedRoom'));

const canRemoveUser = () => hasAllPermission('remove-user', Session.get('openedRoom'));

const canBlockUser = () =>
	ChatSubscription.findOne({ rid: Session.get('openedRoom'), 'u._id': Meteor.userId() }, { fields: { blocker: 1 } })
		.blocker;

const canDirectMessageTo = (username) => {
	const subscription = Subscriptions.findOne({ rid: Session.get('openedRoom') });
	const canOpenDm = hasAllPermission('create-d') || Subscriptions.findOne({ name: username });
	const dmIsNotAlreadyOpen = subscription && subscription.name !== username;
	return canOpenDm && dmIsNotAlreadyOpen;
};

export const getActions = ({ user, directActions, hideAdminControls }) => {
	const isIgnored = () => {
		const sub = Subscriptions.findOne({ rid: Session.get('openedRoom') });
		return sub && sub.ignored && sub.ignored.indexOf(user._id) > -1;
	};

	const isActive = () => user && user.active;

	const isLeader = () =>
		user && user._id && !!RoomRoles.findOne({ rid: Session.get('openedRoom'), 'u._id': user._id, roles: 'leader' });
	const isOwner = () =>
		user && user._id && !!RoomRoles.findOne({ rid: Session.get('openedRoom'), 'u._id': user._id, roles: 'owner' });
	const isModerator = () =>
		user && user._id && !!RoomRoles.findOne({ rid: Session.get('openedRoom'), 'u._id': user._id, roles: 'moderator' });
	const isInDirectMessageRoom = () => {
		const room = ChatRoom.findOne(Session.get('openedRoom'));
		return (room && room.t) === 'd';
	};

	const isMuted = () => {
		const room = ChatRoom.findOne(Session.get('openedRoom'));

		if (room && room.ro) {
			if (_.isArray(room.unmuted) && room.unmuted.indexOf(user && user.username) !== -1) {
				return false;
			}

			if (userHasAllPermission(user._id, 'post-readonly', room)) {
				return _.isArray(room.muted) && (room.muted.indexOf(user && user.username) !== -1);
			}

			return true;
		}

		return room && Array.isArray(room.muted) && room.muted.indexOf(user && user.username) > -1;
	};

	const isSelf = (username) => {
		const user = Meteor.user();
		return user && user.username === username;
	};

	const hasAdminRole = () => user && user._id && hasRole(user._id, 'admin');

	const getUser = function getUser(fn, ...args) {
		if (!user) {
			return;
		}
		return fn.apply(this, [user, ...args]);
	};

	const prevent = (fn, ...args) => function(e, { instance }) {
		e.stopPropagation();
		e.preventDefault();
		return fn.apply(instance, args);
	};

	const success = (fn) => function(error, result) {
		if (error) {
			return handleError(error);
		}
		if (result) {
			fn.call(this, result);
		}
	};


	const hasAlreadyFollowed = (username) => {
		Meteor.call('hasAlreadyFollowed', username, function(error, result) {
			if (error) {
				console.log(error);
				return false;
			}
			Session.set('hasFollowed', result);
			return result;
		});
	};


	const actions = [
		{
			icon: 'message',
			name: t('Conversation'),
			action: prevent(getUser, ({ username }) =>
				Meteor.call('createDirectMessage', username, success((result) => result.rid && FlowRouter.go('direct', { username }, FlowRouter.current().queryParams)))
			),
			condition() {
				return canDirectMessageTo(this.username);
			},
		},

		function() {
			if (isSelf(this.username) || !directActions) {
				return;
			}
			hasAlreadyFollowed(this.username);

			if (Session.get('hasFollowed')) {
				return {
					icon: 'plus',
					name: t('Unfollow'),
					action: prevent(getUser, ({ username }) =>
						Meteor.call('unfollowUser', username, success(() => toastr.success(TAPi18n.__('You_have_unfollowed__username_', { username }))))
					),
					condition() {
						return settings.get('Newsfeed_enabled');
					},
				};
			}


			return {
				icon: 'plus',
				name: t('Follow'),
				action: prevent(getUser, ({ username }) =>
					Meteor.call('followUser', username, success(() => toastr.success(TAPi18n.__('You_have_followed__username_', { username }))))
				),
				condition() {
					return settings.get('Newsfeed_enabled');
				},
			};
		},

		function() {
			if (isSelf(this.username) || !directActions) {
				return;
			}
			// videoAvaliable
			if (!WebRTC.getInstanceByRoomId(Session.get('openedRoom'))) {
				return;
			}
			// videoActive
			const { localUrl, remoteItems } = WebRTC.getInstanceByRoomId(Session.get('openedRoom'));
			const r = remoteItems.get() || [];
			if (localUrl.get() === null && r.length === 0) {
				return;
			}

			if (WebRTC.getInstanceByRoomId(Session.get('openedRoom')).callInProgress.get()) {
				return {
					icon: 'video',
					name: t('Join_video_call'),
					action() {
						WebRTC.getInstanceByRoomId(Session.get('openedRoom')).joinCall({
							audio: true,
							video: true,
						});
					},
				};
			}
			return {
				icon: 'video',
				name: t('Start_video_call'),
				action() {
					WebRTC.getInstanceByRoomId(Session.get('openedRoom')).startCall({
						audio: true,
						video: true,
					});
				},
			};
		},

		function() {
			if (isSelf(this.username) || !directActions) {
				return;
			}
			// videoAvaliable
			if (!WebRTC.getInstanceByRoomId(Session.get('openedRoom'))) {
				return;
			}
			// videoActive
			const { localUrl, remoteItems } = WebRTC.getInstanceByRoomId(Session.get('openedRoom'));
			const r = remoteItems.get() || [];
			if (localUrl.get() === null && r.length === 0) {
				return;
			}

			if (WebRTC.getInstanceByRoomId(Session.get('openedRoom')).callInProgress.get()) {
				return {
					icon: 'mic',
					name: t('Join_audio_call'),
					action() {
						WebRTC.getInstanceByRoomId(Session.get('openedRoom')).joinCall({
							audio: true,
							video: false,
						});
					},
				};
			}
			return {
				icon: 'mic',
				name: t('Start_audio_call'),
				action() {
					WebRTC.getInstanceByRoomId(Session.get('openedRoom')).startCall({
						audio: true,
						video: false,
					});
				},
			};
		}, function() {
			if (!isInDirectMessageRoom() || isSelf(this.username)) {
				return;
			}
			if (canBlockUser()) {
				return {
					icon: 'ban',
					name: t('Unblock_User'),
					action: prevent(getUser, ({ _id }) => Meteor.call('unblockUser', { rid: Session.get('openedRoom'), blocked: _id }, success(() => toastr.success(t('User_is_unblocked'))))),
				};
			}
			return {
				icon: 'ban',
				name: t('Block_User'),
				modifier: 'alert',
				action: prevent(getUser, ({ _id }) => Meteor.call('blockUser', { rid: Session.get('openedRoom'), blocked: _id }, success(() => toastr.success(t('User_is_blocked'))))),
			};
		}, () => {
			if (!directActions || !canSetOwner()) {
				return;
			}
			if (isOwner()) {
				return {
					group: 'channel',
					name: t('Remove_as_owner'),
					icon: 'shield-check',
					action: prevent(getUser, ({ _id, username }) => {
						const userOwner = RoomRoles.findOne({ rid: Session.get('openedRoom'), 'u._id': _id, roles: 'owner' }, { fields: { _id: 1 } });
						if (userOwner == null) {
							return;
						}
						Meteor.call('removeRoomOwner', Session.get('openedRoom'), _id, success(() => {
							const room = ChatRoom.findOne(Session.get('openedRoom'));
							toastr.success(TAPi18n.__('User__username__removed_from__room_name__owners', { username, room_name: roomTypes.getRoomName(room.t, room) }));
						}));
					}) };
			}
			return {
				group: 'channel',
				name: t('Set_as_owner'),
				icon: 'shield-check',
				action: prevent(getUser, ({ _id, username }) => {
					const userOwner = RoomRoles.findOne({ rid: Session.get('openedRoom'), 'u._id': _id, roles: 'owner' }, { fields: { _id: 1 } });
					if (userOwner != null) {
						return;
					}
					Meteor.call('addRoomOwner', Session.get('openedRoom'), _id, success(() => {
						const room = ChatRoom.findOne(Session.get('openedRoom'));
						toastr.success(TAPi18n.__('User__username__is_now_a_owner_of__room_name_', { username, room_name: roomTypes.getRoomName(room.t, room) }));
					}));
				}),
			};
		}, () => {
			if (!directActions || !canSetLeader()) {
				return;
			}
			if (isLeader()) {
				return {
					group: 'channel',
					name: t('Remove_as_leader'),
					icon: 'shield-alt',
					action: prevent(getUser, ({ username, _id }) => {
						const userLeader = RoomRoles.findOne({ rid: Session.get('openedRoom'), 'u._id': _id, roles: 'leader' }, { fields: { _id: 1 } });
						if (!userLeader) {
							return;
						}
						Meteor.call('removeRoomLeader', Session.get('openedRoom'), _id, success(() => {
							const room = ChatRoom.findOne(Session.get('openedRoom'));
							toastr.success(TAPi18n.__('User__username__removed_from__room_name__leaders', { username, room_name: roomTypes.getRoomName(room.t, room) }));
						}));
					}),
				};
			}
			return {
				group: 'channel',
				name: t('Set_as_leader'),
				icon: 'shield-alt',
				action: prevent(getUser, ({ _id, username }) => {
					const userLeader = RoomRoles.findOne({ rid: Session.get('openedRoom'), 'u._id': _id, roles: 'leader' }, { fields: { _id: 1 } });
					if (userLeader) {
						return;
					}
					Meteor.call('addRoomLeader', Session.get('openedRoom'), _id, success(() => {
						const room = ChatRoom.findOne(Session.get('openedRoom'));
						toastr.success(TAPi18n.__('User__username__is_now_a_leader_of__room_name_', { username, room_name: roomTypes.getRoomName(room.t, room) }));
					}));
				}),
			};
		}, () => {
			if (!directActions || !canSetModerator()) {
				return;
			}
			if (isModerator()) {
				return {
					group: 'channel',
					name: t('Remove_as_moderator'),
					icon: 'shield',
					action: prevent(getUser, ({ username, _id }) => {
						const userModerator = RoomRoles.findOne({ rid: Session.get('openedRoom'), 'u._id': _id, roles: 'moderator' }, { fields: { _id: 1 } });
						if (userModerator == null) {
							return;
						}
						Meteor.call('removeRoomModerator', Session.get('openedRoom'), _id, success(() => {
							const room = ChatRoom.findOne(Session.get('openedRoom'));
							toastr.success(TAPi18n.__('User__username__removed_from__room_name__moderators', { username, room_name: roomTypes.getRoomName(room.t, room) }));
						}));
					}),
				};
			}
			return {
				group: 'channel',
				name: t('Set_as_moderator'),
				icon: 'shield',
				action: prevent(getUser, ({ _id, username }) => {
					const userModerator = RoomRoles.findOne({ rid: Session.get('openedRoom'), 'u._id': _id, roles: 'moderator' }, { fields: { _id: 1 } });
					if (userModerator != null) {
						return;
					}
					Meteor.call('addRoomModerator', Session.get('openedRoom'), _id, success(() => {
						const room = ChatRoom.findOne(Session.get('openedRoom'));
						toastr.success(TAPi18n.__('User__username__is_now_a_moderator_of__room_name_', { username, room_name: roomTypes.getRoomName(room.t, room) }));
					}));
				}),
			};
		}, () => {
			if (!directActions || user._id === Meteor.userId()) {
				return;
			}
			if (isIgnored()) {
				return {
					group: 'channel',
					icon: 'ban',
					name: t('Unignore'),
					action: prevent(getUser, ({ _id }) => Meteor.call('ignoreUser', { rid: Session.get('openedRoom'), userId: _id, ignore: false }, success(() => toastr.success(t('User_has_been_unignored'))))),
				};
			}
			return {
				group: 'channel',
				icon: 'ban',
				name: t('Ignore'),
				action: prevent(getUser, ({ _id }) => Meteor.call('ignoreUser', { rid: Session.get('openedRoom'), userId: _id, ignore: true }, success(() => toastr.success(t('User_has_been_ignored'))))),
			};
		}, () => {
			if (!directActions || !canMuteUser()) {
				return;
			}
			if (isMuted()) {
				return {
					group: 'channel',
					icon: 'mic',
					name: t('Unmute_user'),
					action: prevent(getUser, ({ username }) => {
						const rid = Session.get('openedRoom');
						if (!hasAllPermission('mute-user', rid)) {
							return toastr.error(TAPi18n.__('error-not-allowed'));
						}
						Meteor.call('unmuteUserInRoom', { rid, username }, success(() => toastr.success(TAPi18n.__('User_unmuted_in_room'))));
					}),
				};
			}
			return {
				group: 'channel',
				icon: 'mute',
				name: t('Mute_user'),
				action: prevent(getUser, ({ username }) => {
					const rid = Session.get('openedRoom');
					const room = ChatRoom.findOne(rid);
					if (!hasAllPermission('mute-user', rid)) {
						return toastr.error(TAPi18n.__('error-not-allowed'));
					}
					modal.open({
						title: t('Are_you_sure'),
						text: t('The_user_wont_be_able_to_type_in_s', roomTypes.getRoomName(room.t, room)),
						type: 'warning',
						showCancelButton: true,
						confirmButtonColor: '#DD6B55',
						confirmButtonText: t('Yes_mute_user'),
						cancelButtonText: t('Cancel'),
						closeOnConfirm: false,
						html: false,
					}, () =>
						Meteor.call('muteUserInRoom', { rid, username }, success(() => {
							modal.open({
								title: t('Muted'),
								text: t('User_has_been_muted_in_s', roomTypes.getRoomName(room.t, room)),
								type: 'success',
								timer: 2000,
								showConfirmButton: false,
							});
						}))
					);
				}),
			};
		}, {
			group: 'channel',
			icon: 'sign-out',
			modifier: 'alert',
			name: t('Remove_from_room'),
			action: prevent(getUser, (user) => {
				const rid = Session.get('openedRoom');
				const room = ChatRoom.findOne(rid);
				if (!hasAllPermission('remove-user', rid)) {
					return toastr.error(TAPi18n.__('error-not-allowed'));
				}
				modal.open({
					title: t('Are_you_sure'),
					text: t('The_user_will_be_removed_from_s', roomTypes.getRoomName(room.t, room)),
					type: 'warning',
					showCancelButton: true,
					confirmButtonColor: '#DD6B55',
					confirmButtonText: t('Yes_remove_user'),
					cancelButtonText: t('Cancel'),
					closeOnConfirm: false,
					html: false,
				}, () => Meteor.call('removeUserFromRoom', { rid, username: user.username }, success(() => {
					modal.open({
						title: t('Removed'),
						text: t('User_has_been_removed_from_s', roomTypes.getRoomName(room.t, room)),
						type: 'success',
						timer: 2000,
						showConfirmButton: false,
					});
					return this.instance.clear();
				})));
			}),
			condition: () => directActions && canRemoveUser(),
		}, {
			icon: 'edit',
			name: 'Edit',
			group: 'admin',
			condition: () => !hideAdminControls && hasPermission('edit-other-user-info'),
			action: prevent(getUser, function(user) {
				this.editingUser.set(user._id);
			}),
		}, {
			icon: 'trash',
			name: 'Delete',
			action: prevent(getUser, ({ _id }) => {
				const erasureType = settings.get('Message_ErasureType');
				const warningKey = `Delete_User_Warning_${ erasureType }`;

				modal.open({
					title: t('Are_you_sure'),
					text: t(warningKey),
					type: 'warning',
					showCancelButton: true,
					confirmButtonColor: '#DD6B55',
					confirmButtonText: t('Yes_delete_it'),
					cancelButtonText: t('Cancel'),
					closeOnConfirm: false,
					html: false,
				}, () => {
					Meteor.call('deleteUser', _id, success(() => {
						modal.open({
							title: t('Deleted'),
							text: t('User_has_been_deleted'),
							type: 'success',
							timer: 2000,
							showConfirmButton: false,
						});
						this.instance.tabBar.close();
					}));
				});
			}),
			group: 'admin',
			condition: () => !hideAdminControls && hasPermission('delete-user'),
		}, () => {
			if (hideAdminControls || !hasPermission('assign-admin-role')) {
				return;
			}
			if (hasAdminRole()) {
				return {
					group: 'admin',
					icon: 'key',
					name: t('Remove_Admin'),
					action: prevent(getUser, ({ _id }) => Meteor.call('setAdminStatus', _id, false, success(() => toastr.success(t('User_is_no_longer_an_admin'))))),
				};
			}
			return {
				group: 'admin',
				icon: 'key',
				name: t('Make_Admin'),
				action: prevent(getUser, ({ _id }) => Meteor.call('setAdminStatus', _id, true, success(() => toastr.success(t('User_is_now_an_admin'))))),
			};
		}, () => {
			if (hideAdminControls || !hasPermission('edit-other-user-active-status')) {
				return;
			}
			if (isActive()) {
				return {
					group: 'admin',
					icon: 'user',
					id: 'deactivate',
					name: t('Deactivate'),
					modifier: 'alert',
					action: prevent(getUser, ({ _id }) => Meteor.call('setUserActiveStatus', _id, false, success(() => toastr.success(t('User_has_been_deactivated'))))),
				};
			}
			return {
				group: 'admin',
				icon: 'user',
				id: 'activate',
				name: t('Activate'),
				action: prevent(getUser, ({ _id }) => Meteor.call('setUserActiveStatus', _id, true, success(() => toastr.success(t('User_has_been_activated'))))),
			};
		}, () => {
			if (hideAdminControls || !hasPermission('reset-other-user-e2e-key')) {
				return;
			}
			if (!settings.get('E2E_Enable')) {
				return;
			}

			return {
				group: 'admin',
				icon: 'key',
				id: 'reset-e2e',
				name: t('Reset_E2E_Key'),
				action: prevent(getUser, ({ _id }) => Meteor.call('e2e.resetUserE2EKey', _id, success(() => toastr.success(t('User_e2e_key_was_reset'))))),
			};
		}];

	return actions;
};

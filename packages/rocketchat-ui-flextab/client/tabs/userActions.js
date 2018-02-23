/* globals RoomRoles, WebRTC*/
import _ from 'underscore';
import toastr from 'toastr';


export const getActions = function({ user, directActions, hideAdminControls }) {

	const hasPermission = RocketChat.authz.hasAllPermission;

	const canSetLeader= () => {
		return RocketChat.authz.hasAllPermission('set-leader', Session.get('openedRoom'));
	};
	const active = () => {
		return user && user.active;
	};
	const hasAdminRole = () => {
		if (user && user._id) {
			return RocketChat.authz.hasRole(user._id, 'admin');
		}
	};
	const canRemoveUser = () => {
		return RocketChat.authz.hasAllPermission('remove-user', Session.get('openedRoom'));
	};
	const canSetModerator = () => {
		return RocketChat.authz.hasAllPermission('set-moderator', Session.get('openedRoom'));
	};
	const isDirect = () => {
		const room = ChatRoom.findOne(Session.get('openedRoom'));
		return (room != null ? room.t : undefined) === 'd';
	};
	const isBlocker = () => {
		const subscription = ChatSubscription.findOne({rid:Session.get('openedRoom'), 'u._id': Meteor.userId()}, { fields: { blocker: 1 } });
		return subscription.blocker;
	};
	const isLeader = () => {
		if (user && user._id) {
			return !!RoomRoles.findOne({ rid: Session.get('openedRoom'), 'u._id': user._id, roles: 'leader' });
		}
	};
	const isOwner = () => {
		if (user && user._id) {
			return !!RoomRoles.findOne({ rid: Session.get('openedRoom'), 'u._id': user._id, roles: 'owner' });
		}
	};
	const isModerator = () => {
		if (user && user._id) {
			return !!RoomRoles.findOne({ rid: Session.get('openedRoom'), 'u._id': user._id, roles: 'moderator' });
		}
	};
	const canSetOwner = () => {
		return RocketChat.authz.hasAllPermission('set-owner', Session.get('openedRoom'));
	};
	const canDirectMessage = (username) => {
		const user = Meteor.user();
		return RocketChat.authz.hasAllPermission('create-d') && user && user.username !== username;
	};
	const canMuteUser = () => {
		return RocketChat.authz.hasAllPermission('mute-user', Session.get('openedRoom'));
	};
	const userMuted = () => {
		const room = ChatRoom.findOne(Session.get('openedRoom'));
		return _.isArray(room && room.muted) && (room.muted.indexOf(user && user.username) !== -1);
	};
	const isSelf = (username) => {
		const user = Meteor.user();
		return user && user.username === username;
	};
	const getUser = function getUser(fn, ...args) {
		if (!user) {
			return;
		}
		return fn.apply(this, [user, ...args]);
	};
	const prevent = function prevent(fn, ...args) {
		return function(e, {instance}) {
			e.stopPropagation();
			e.preventDefault();
			return fn.apply(instance, args);
		};
	};
	const success = function success(fn) {
		return function(error, result) {
			if (error) {
				return handleError(error);
			}
			if (result) {
				fn.call(this, result);
			}
		};
	};
	const actions = [
		{
			icon: 'message',
			name: t('Conversation'),
			action: prevent(getUser, ({username}) =>
				Meteor.call('createDirectMessage', username, success(result => result.rid && FlowRouter.go('direct', { username }, FlowRouter.current().queryParams)))
			),
			condition() {
				return (directActions && canDirectMessage(this.username));
			}
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
			const {localUrl, remoteItems} = WebRTC.getInstanceByRoomId(Session.get('openedRoom'));
			const r = remoteItems.get() || [];
			if (localUrl.get() === null && r.length === 0) {
				return;
			}

			if (WebRTC.getInstanceByRoomId(Session.get('openedRoom')).callInProgress.get()) {
				return {
					icon : 'video',
					name: t('Join_video_call'),
					action() {
						WebRTC.getInstanceByRoomId(Session.get('openedRoom')).joinCall({
							audio: true,
							video: true
						});
					}
				};
			}
			return {
				icon : 'video',
				name: t('Start_video_call'),
				action() {
					WebRTC.getInstanceByRoomId(Session.get('openedRoom')).startCall({
						audio: true,
						video: true
					});
				}
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
			const {localUrl, remoteItems} = WebRTC.getInstanceByRoomId(Session.get('openedRoom'));
			const r = remoteItems.get() || [];
			if (localUrl.get() === null && r.length === 0) {
				return;
			}

			if (WebRTC.getInstanceByRoomId(Session.get('openedRoom')).callInProgress.get()) {
				return {
					icon : 'mic',
					name: t('Join_audio_call'),
					action() {
						WebRTC.getInstanceByRoomId(Session.get('openedRoom')).joinCall({
							audio: true,
							video: false
						});
					}
				};
			}
			return {
				icon : 'mic',
				name: t('Start_audio_call'),
				action() {
					WebRTC.getInstanceByRoomId(Session.get('openedRoom')).startCall({
						audio: true,
						video: false
					});
				}
			};
		}, function() {
			if (!isDirect() || isSelf(this.username)) {
				return;
			}
			if (isBlocker()) {
				return {
					icon : 'mic',
					name:t('Unblock_User'),
					action: prevent(getUser, ({_id}) => Meteor.call('unblockUser', { rid: Session.get('openedRoom'), blocked: _id }, success(() => toastr.success(t('User_is_unblocked')))))
				};
			}
			return {
				icon : 'mic',
				name:t('Block_User'),
				modifier: 'alert',
				action: prevent(getUser, ({_id}) => Meteor.call('blockUser', { rid: Session.get('openedRoom'), blocked: _id }, success(() => toastr.success(t('User_is_blocked')))))
			};
		}, () => {
			if (!directActions || !canSetOwner()) {
				return;
			}
			if (isOwner()) {
				return {
					group: 'channel',
					name:t('Remove_as_owner'),
					icon: 'shield-check',
					action: prevent(getUser, ({_id, username})=> {
						const userOwner = RoomRoles.findOne({ rid: Session.get('openedRoom'), 'u._id': _id, roles: 'owner' }, { fields: { _id: 1 } });
						if (userOwner == null) {
							return;
						}
						Meteor.call('removeRoomOwner', Session.get('openedRoom'), _id, success(() => {
							const room = ChatRoom.findOne(Session.get('openedRoom'));
							toastr.success(TAPi18n.__('User__username__removed_from__room_name__owners', { username, room_name: room.name }));
						}));
					})};
			}
			return {
				group: 'channel',
				name: t('Set_as_owner'),
				icon: 'shield-check',
				action: prevent(getUser, ({_id, username}) => {
					const userOwner = RoomRoles.findOne({ rid: Session.get('openedRoom'), 'u._id': _id, roles: 'owner' }, { fields: { _id: 1 } });
					if (userOwner != null) {
						return;
					}
					Meteor.call('addRoomOwner', Session.get('openedRoom'), _id, success(() => {
						const room = ChatRoom.findOne(Session.get('openedRoom'));
						toastr.success(TAPi18n.__('User__username__is_now_a_owner_of__room_name_', { username, room_name: room.name }));
					}));

				})
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
					action: prevent(getUser, ({username, _id}) => {
						const userLeader = RoomRoles.findOne({ rid: Session.get('openedRoom'), 'u._id': _id, roles: 'leader' }, { fields: { _id: 1 } });
						if (!userLeader) {
							return;
						}
						Meteor.call('removeRoomLeader', Session.get('openedRoom'), _id, success(() => {
							const room = ChatRoom.findOne(Session.get('openedRoom'));
							toastr.success(TAPi18n.__('User__username__removed_from__room_name__leaders', { username, room_name: room.name }));
						}));
					})
				};
			}
			return {
				group: 'channel',
				name:t('Set_as_leader'),
				icon: 'shield-alt',
				action: prevent(getUser, ({_id, username}) => {
					const userLeader = RoomRoles.findOne({ rid: Session.get('openedRoom'), 'u._id': _id, roles: 'leader' }, { fields: { _id: 1 } });
					if (userLeader) {
						return;
					}
					Meteor.call('addRoomLeader', Session.get('openedRoom'), _id, success(() => {
						const room = ChatRoom.findOne(Session.get('openedRoom'));
						toastr.success(TAPi18n.__('User__username__is_now_a_leader_of__room_name_', { username, room_name: room.name }));
					}));
				})
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
					action: prevent(getUser, ({username, _id}) => {
						const userModerator = RoomRoles.findOne({ rid: Session.get('openedRoom'), 'u._id': _id, roles: 'moderator' }, { fields: { _id: 1 } });
						if (userModerator == null) {
							return;
						}
						Meteor.call('removeRoomModerator', Session.get('openedRoom'), _id, success(()=> {
							const room = ChatRoom.findOne(Session.get('openedRoom'));
							toastr.success(TAPi18n.__('User__username__removed_from__room_name__moderators', { username, room_name: room.name }));
						}));
					})
				};
			}
			return {
				group: 'channel',
				name: t('Set_as_moderator'),
				icon: 'shield',
				action: prevent(getUser, ({_id, username}) => {
					const userModerator = RoomRoles.findOne({ rid: Session.get('openedRoom'), 'u._id': _id, roles: 'moderator' }, { fields: { _id: 1 } });
					if (userModerator != null) {
						return;
					}
					Meteor.call('addRoomModerator', Session.get('openedRoom'), _id, success(() => {
						const room = ChatRoom.findOne(Session.get('openedRoom'));
						toastr.success(TAPi18n.__('User__username__is_now_a_moderator_of__room_name_', { username, room_name: room.name }));
					}));
				})
			};
		}, () => {
			if (!directActions || !canMuteUser()) {
				return;
			}
			if (userMuted()) {
				return {
					group: 'channel',
					icon : 'mic',
					name: t('Unmute_user'),
					action:prevent(getUser, ({username}) => {
						const rid = Session.get('openedRoom');
						if (!RocketChat.authz.hasAllPermission('mute-user', rid)) {
							return toastr.error(TAPi18n.__('error-not-allowed'));
						}
						Meteor.call('unmuteUserInRoom', { rid, username }, success(() => toastr.success(TAPi18n.__('User_unmuted_in_room'))));
					})
				};
			}
			return {
				group: 'channel',
				icon : 'mute',
				name: t('Mute_user'),
				action: prevent(getUser, ({username}) => {
					const rid = Session.get('openedRoom');
					const room = ChatRoom.findOne(rid);
					if (!RocketChat.authz.hasAllPermission('mute-user', rid)) {
						return toastr.error(TAPi18n.__('error-not-allowed'));
					}
					modal.open({
						title: t('Are_you_sure'),
						text: t('The_user_wont_be_able_to_type_in_s', room.name),
						type: 'warning',
						showCancelButton: true,
						confirmButtonColor: '#DD6B55',
						confirmButtonText: t('Yes'),
						cancelButtonText: t('Cancel'),
						closeOnConfirm: false,
						html: false
					}, () =>
						Meteor.call('muteUserInRoom', { rid, username }, success(() => {
							modal.open({
								title: t('Muted'),
								text: t('User_has_been_muted_in_s', room.name),
								type: 'success',
								timer: 2000,
								showConfirmButton: false
							});
						}))
					);
				})
			};
		}, {
			group: 'channel',
			icon: 'sign-out',
			modifier: 'alert',
			name: t('Remove_from_room'),
			action: prevent(getUser, user => {
				const rid = Session.get('openedRoom');
				const room = ChatRoom.findOne(rid);
				if (!RocketChat.authz.hasAllPermission('remove-user', rid)) {
					return toastr.error(TAPi18n.__('error-not-allowed'));
				}
				modal.open({
					title: t('Are_you_sure'),
					text: t('The_user_will_be_removed_from_s', room.name),
					type: 'warning',
					showCancelButton: true,
					confirmButtonColor: '#DD6B55',
					confirmButtonText: t('Yes'),
					cancelButtonText: t('Cancel'),
					closeOnConfirm: false,
					html: false
				}, () => {
					return Meteor.call('removeUserFromRoom', { rid, username: user.username }, success(() => {
						modal.open({
							title: t('Removed'),
							text: t('User_has_been_removed_from_s', room.name),
							type: 'success',
							timer: 2000,
							showConfirmButton: false
						});
						return this.instance.clear();
					}));
				});
			}),
			condition: () => {
				return directActions && canRemoveUser();
			}
		}, {
			icon : 'edit',
			name: 'Edit',
			group: 'admin',
			condition: () => !hideAdminControls && hasPermission('edit-other-user-info'),
			action: prevent(getUser, function(user) {
				this.editingUser.set(user._id);
			})
		}, {
			icon : 'trash',
			name: 'Delete',
			action: prevent(getUser, ({_id}) => {
				modal.open({
					title: t('Are_you_sure'),
					text: t('Delete_User_Warning'),
					type: 'warning',
					showCancelButton: true,
					confirmButtonColor: '#DD6B55',
					confirmButtonText: t('Yes'),
					cancelButtonText: t('Cancel'),
					closeOnConfirm: false,
					html: false
				}, () => {
					Meteor.call('deleteUser', _id, success(() => {
						modal.open({
							title: t('Deleted'),
							text: t('User_has_been_deleted'),
							type: 'success',
							timer: 2000,
							showConfirmButton: false
						});
						this.instance.tabBar.close();
					}));
				});
			}),
			group: 'admin',
			condition: () => !hideAdminControls && hasPermission('delete-user')
		}, () => {
			if (hideAdminControls || !hasPermission('assign-admin-role')) {
				return;
			}
			if (hasAdminRole()) {
				return {
					group: 'admin',
					icon : 'key',
					name: t('Remove_Admin'),
					action: prevent(getUser, ({_id}) => Meteor.call('setAdminStatus', _id, false, success(() => toastr.success(t('User_is_no_longer_an_admin')))))
				};
			}
			return {
				group: 'admin',
				icon : 'key',
				name: t('Make_Admin'),
				action: prevent(getUser, ({_id}) => Meteor.call('setAdminStatus', _id, true, success(() => toastr.success(t('User_is_now_an_admin')))))
			};
		}, () => {
			if (hideAdminControls || !hasPermission('edit-other-user-active-status')) {
				return;
			}
			if (active()) {
				return {
					group: 'admin',
					icon : 'user',
					id: 'deactivate',
					name: t('Deactivate'),
					modifier: 'alert',
					action: prevent(getUser, ({_id}) => Meteor.call('setUserActiveStatus', _id, false, success(() => toastr.success(t('User_has_been_deactivated')))))
				};
			}
			return {
				group: 'admin',
				icon: 'user',
				id: 'activate',
				name: t('Activate'),
				action: prevent(getUser, ({_id}) => Meteor.call('setUserActiveStatus', _id, true, success(() => toastr.success(t('User_has_been_activated')))))
			};
		}];
	return actions;
};

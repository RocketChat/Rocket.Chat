/* globals RoomRoles, UserRoles, WebRTC*/
import _ from 'underscore';
import s from 'underscore.string';
import moment from 'moment';
import toastr from 'toastr';

const hasPermission = RocketChat.authz.hasAllPermission;
const canSetLeader= () => {
	return RocketChat.authz.hasAllPermission('set-leader', Session.get('openedRoom'));
};
const active = () => {
	const user = Template.instance().user.get();
	return user && user.active;
};
const hasAdminRole = () => {
	const user = Template.instance().user.get();
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
	const user = Template.instance().user.get();
	if (user && user._id) {
		return !!RoomRoles.findOne({ rid: Session.get('openedRoom'), 'u._id': user._id, roles: 'leader' });
	}
};
const isOwner = () => {
	const user = Template.instance().user.get();
	if (user && user._id) {
		return !!RoomRoles.findOne({ rid: Session.get('openedRoom'), 'u._id': user._id, roles: 'owner' });
	}
};
const isModerator = () => {
	const user = Template.instance().user.get();
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
	const user = Template.instance().user.get();

	return _.isArray(room && room.muted) && (room.muted.indexOf(user && user.username) !== -1);
};
const isSelf = (username) => {
	const user = Meteor.user();
	return user && user.username === username;
};
const getUser = function getUser(fn, ...args) {
	const user = this.user && this.user.get();
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
			return (Template.instance().data.showAll && canDirectMessage(this.username));
		}
	},

	function() {
		if (isSelf(this.username) || Template.instance().data.showAll) {
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
		if (isSelf(this.username) || Template.instance().data.showAll) {
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
		if (!Template.instance().data.showAll || !canSetOwner()) {
			return;
		}
		if (isOwner()) {
			return {
				group: 'channel',
				name:t('Remove_as_owner'),
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
		if (!Template.instance().data.showAll || !canSetLeader()) {
			return;
		}
		if (isLeader()) {
			return {
				group: 'channel',
				name: t('Remove_as_leader'),
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

		if (!Template.instance().data.showAll || !canSetModerator()) {
			return;
		}
		if (isModerator()) {
			return {
				group: 'channel',
				name: t('Remove_as_moderator'),
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
		if (!Template.instance().data.showAll || !canMuteUser()) {
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
					confirmButtonText: t('Yes_mute_user'),
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
				confirmButtonText: t('Yes_remove_user'),
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
			return Template.instance().data.showAll && canRemoveUser();
		}
	}, {
		icon : 'edit',
		name: 'Edit',
		group: 'admin',
		condition: () => !Template.instance().data.hideAdminControls && hasPermission('edit-other-user-info'),
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
				confirmButtonText: t('Yes_delete_it'),
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
		condition: () => !Template.instance().data.hideAdminControls && hasPermission('delete-user')
	}, () => {
		if (!Template.instance().data.hideAdminControls || !hasPermission('assign-admin-role')) {
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
		if (!Template.instance().data.hideAdminControls || !hasPermission('edit-other-user-active-status')) {
			return;
		}
		if (active()) {
			return {
				group: 'admin',
				icon : 'user',
				name: t('Deactivate'),
				modifier: 'alert',
				action: prevent(getUser, ({_id}) => Meteor.call('setUserActiveStatus', _id, false, success(() => toastr.success(t('User_has_been_deactivated')))))
			};
		}
		return {
			group: 'admin',
			icon: 'user',
			name: t('Activate'),
			action: prevent(getUser, ({_id}) => Meteor.call('setUserActiveStatus', _id, true, success(() => toastr.success(t('User_has_been_activated')))))
		};
	}];
const more = function() {
	return actions.map(action => typeof action === 'function' ? action.call(this): action).filter(action => action && (!action.condition || action.condition.call(this))).slice(2);
};


Template.userInfo.helpers({
	moreActions: more,
	actions() {
		return actions.map(action => typeof action === 'function' ? action.call(this): action).filter(action => action && (!action.condition || action.condition.call(this))).slice(0, 2);
	},
	customField() {
		if (!RocketChat.authz.hasAllPermission('view-full-other-user-info')) {
			return;
		}

		const sCustomFieldsToShow = RocketChat.settings.get('Accounts_CustomFieldsToShowInUserInfo').trim();
		const customFields = [];

		if (sCustomFieldsToShow) {
			const user = Template.instance().user.get();
			const userCustomFields = user && user.customFields || {};
			const listOfCustomFieldsToShow = JSON.parse(sCustomFieldsToShow);

			_.map(listOfCustomFieldsToShow, (el) => {
				let content = '';
				if (_.isObject(el)) {
					_.map(el, (key, label) => {
						const value = RocketChat.templateVarHandler(key, userCustomFields);
						if (value) {
							content = `${ label }: ${ value }`;
						}
					});
				} else {
					content = RocketChat.templateVarHandler(el, userCustomFields);
				}
				if (content) {
					customFields.push(content);
				}
			});
		}
		return customFields;
	},

	name() {
		const user = Template.instance().user.get();
		return user && user.name ? user.name : TAPi18n.__('Unnamed');
	},

	username() {
		const user = Template.instance().user.get();
		return user && user.username;
	},

	email() {
		const user = Template.instance().user.get();
		return user && user.emails && user.emails[0] && user.emails[0].address;
	},

	utc() {
		const user = Template.instance().user.get();
		if (user && user.utcOffset != null) {
			if (user.utcOffset > 0) {
				return `+${ user.utcOffset }`;
			}
			return user.utcOffset;
		}
	},

	lastLogin() {
		const user = Template.instance().user.get();
		if (user && user.lastLogin) {
			return moment(user.lastLogin).format('LLL');
		}
	},

	createdAt() {
		const user = Template.instance().user.get();
		if (user && user.createdAt) {
			return moment(user.createdAt).format('LLL');
		}
	},
	linkedinUsername() {
		const user = Template.instance().user.get();
		if (user && user.services && user.services.linkedin && user.services.linkedin.publicProfileUrl) {
			return s.strRight(user.services.linkedin.publicProfileUrl), '/in/';
		}
	},

	servicesMeteor() {
		const user = Template.instance().user.get();
		return user && user.services && user.services['meteor-developer'];
	},

	userTime() {
		const user = Template.instance().user.get();
		if (user && user.utcOffset != null) {
			return Template.instance().now.get().utcOffset(user.utcOffset).format(RocketChat.settings.get('Message_TimeFormat'));
		}
	},

	user() {
		return Template.instance().user.get();
	},

	hasEmails() {
		return _.isArray(this.emails);
	},

	hasPhone() {
		return _.isArray(this.phone);
	},

	isLoading() {
		return Template.instance().loadingUserInfo.get();
	},

	editingUser() {
		return Template.instance().editingUser.get();
	},

	userToEdit() {
		const instance = Template.instance();
		return {
			user: instance.user.get(),
			back(username) {
				instance.editingUser.set();

				if (username != null) {
					const user = instance.user.get();
					if ((user != null ? user.username : undefined) !== username) {
						return instance.loadedUsername.set(username);
					}
				}
			}
		};
	},

	roleTags() {
		const user = Template.instance().user.get();
		if (!user || !user._id) {
			return;
		}
		const userRoles = UserRoles.findOne(user._id) || {};
		const roomRoles = RoomRoles.findOne({'u._id': user._id, rid: Session.get('openedRoom') }) || {};
		const roles = _.union(userRoles.roles || [], roomRoles.roles || []);
		return roles.length && RocketChat.models.Roles.find({ _id: { $in: roles }, description: { $exists: 1 } }, { fields: { description: 1 } });
	}
});
/* globals isRtl popover */
Template.userInfo.events({
	'click .js-more'(e, instance) {
		const actions = more.call(this);
		const groups = [];
		const columns = [];
		const admin = actions.filter(actions => actions.group === 'admin');
		const others = actions.filter(action => !action.group);
		const channel = actions.filter(actions => actions.group === 'channel');
		if (others.length) {
			groups.push({items:others});
		}
		if (channel.length) {
			groups.push({items:channel});
		}

		if (admin.length) {
			groups.push({items:admin});
		}
		columns[0] = {groups};

		$(e.currentTarget).blur();
		e.preventDefault();
		const config = {
			columns,
			mousePosition: () => ({
				x: e.currentTarget.getBoundingClientRect().right + 10,
				y: e.currentTarget.getBoundingClientRect().bottom + 100
			}),
			customCSSProperties: () => ({
				top:  `${ e.currentTarget.getBoundingClientRect().bottom + 10 }px`,
				left: isRtl() ? `${ e.currentTarget.getBoundingClientRect().left - 10 }px` : undefined
			}),
			data: {
				rid: this._id,
				username: instance.data.username,
				instance
			},
			activeElement: e.currentTarget
		};
		popover.open(config);
	},
	'click .js-action'(e) {
		return this.action && this.action.apply(this, [e, {instance : Template.instance()}]);
	},
	'click .js-close-info'(e, instance) {
		return instance.clear();
	}
});

Template.userInfo.onCreated(function() {
	this.now = new ReactiveVar(moment());
	this.user = new ReactiveVar;
	this.editingUser = new ReactiveVar;
	this.loadingUserInfo = new ReactiveVar(true);
	this.loadedUsername = new ReactiveVar;
	this.tabBar = Template.currentData().tabBar;

	Meteor.setInterval(() => {
		return this.now.set(moment());
	}, 30000);

	this.autorun(() => {
		const username = this.loadedUsername.get();

		if (username == null) {
			this.loadingUserInfo.set(false);
			return;
		}

		this.loadingUserInfo.set(true);

		return this.subscribe('fullUserData', username, 1, () => {
			return this.loadingUserInfo.set(false);
		});
	});

	this.autorun(() => {
		const data = Template.currentData();
		if (data.clear != null) {
			return this.clear = data.clear;
		}
	});

	this.autorun(() => {
		const data = Template.currentData();
		const user = this.user.get();
		return this.loadedUsername.set((user != null ? user.username : undefined) || (data != null ? data.username : undefined));
	});

	return this.autorun(() => {
		let filter;
		const data = Template.currentData();
		if (data && data.username != null) {
			filter = { username: data.username };
		} else if (data && data._id != null) {
			filter = { _id: data._id };
		}
		const user = Meteor.users.findOne(filter);

		return this.user.set(user);
	});
});

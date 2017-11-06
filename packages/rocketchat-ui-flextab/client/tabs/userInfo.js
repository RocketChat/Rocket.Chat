/* globals RoomRoles, UserRoles*/
import _ from 'underscore';
import s from 'underscore.string';
import moment from 'moment';
import toastr from 'toastr';

Template.userInfo.helpers({
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

	canDirectMessage(username) {
		const user = Meteor.user();
		return RocketChat.authz.hasAllPermission('create-d') && user && user.username !== username;
	},

	isSelf(username) {
		const user = Meteor.user();
		return user && user.username === username;
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

	canRemoveUser() {
		return RocketChat.authz.hasAllPermission('remove-user', Session.get('openedRoom'));
	},

	canMuteUser() {
		return RocketChat.authz.hasAllPermission('mute-user', Session.get('openedRoom'));
	},

	userMuted() {
		const room = ChatRoom.findOne(Session.get('openedRoom'));
		const user = Template.instance().user.get();

		return _.isArray(room && room.muted) && (room.muted.indexOf(user && user.username) !== -1);
	},

	canSetModerator() {
		return RocketChat.authz.hasAllPermission('set-moderator', Session.get('openedRoom'));
	},

	isModerator() {
		const user = Template.instance().user.get();
		if (user && user._id) {
			return !!RoomRoles.findOne({ rid: Session.get('openedRoom'), 'u._id': user._id, roles: 'moderator' });
		}
	},

	canSetOwner() {
		return RocketChat.authz.hasAllPermission('set-owner', Session.get('openedRoom'));
	},

	canSetLeader() {
		return RocketChat.authz.hasAllPermission('set-leader', Session.get('openedRoom'));
	},

	isOwner() {
		const user = Template.instance().user.get();
		if (user && user._id) {
			return !!RoomRoles.findOne({ rid: Session.get('openedRoom'), 'u._id': user._id, roles: 'owner' });
		}
	},

	isLeader() {
		const user = Template.instance().user.get();
		if (user && user._id) {
			return !!RoomRoles.findOne({ rid: Session.get('openedRoom'), 'u._id': user._id, roles: 'leader' });
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

	hasAdminRole() {
		const user = Template.instance().user.get();
		if (user && user._id) {
			return RocketChat.authz.hasRole(user._id, 'admin');
		}
	},

	active() {
		const user = Template.instance().user.get();
		return user && user.active;
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
		if (user && user._id) {
			const userRoles = UserRoles.findOne(user._id) || {};
			const roomRoles = RoomRoles.findOne({'u._id': user._id, rid: Session.get('openedRoom') }) || {};
			if (userRoles.roles || roomRoles.roles) {
				const roles = _.union(userRoles.roles || [], roomRoles.roles || []);
				return RocketChat.models.Roles.find({ _id: { $in: roles }, description: { $exists: 1 } }, { fields: { description: 1 } });
			} else {
				return [];
			}
		}
	},

	isDirect() {
		const room = ChatRoom.findOne(Session.get('openedRoom'));

		return (room != null ? room.t : undefined) === 'd';
	},

	isBlocker() {
		const subscription = ChatSubscription.findOne({rid:Session.get('openedRoom'), 'u._id': Meteor.userId()}, { fields: { blocker: 1 } });
		return subscription.blocker;
	}
});

Template.userInfo.events({
	'click .thumb'(e) {
		return $(e.currentTarget).toggleClass('bigger');
	},

	'click .pvt-msg'(e, instance) {
		return Meteor.call('createDirectMessage', this.username, (error, result) => {
			if (error) {
				return handleError(error);
			}

			if ((result != null ? result.rid : undefined) != null) {
				return FlowRouter.go('direct', { username: this.username }, FlowRouter.current().queryParams, function() {
					if (window.matchMedia('(max-width: 500px)').matches) {
						return instance.tabBar.close();
					}
				});
			}
		});
	},

	'click .back'(e, instance) {
		return instance.clear();
	},

	'click .remove-user'(e, instance) {
		e.preventDefault();
		const rid = Session.get('openedRoom');
		const room = ChatRoom.findOne(rid);
		const user = instance.user.get();
		if (user && RocketChat.authz.hasAllPermission('remove-user', rid)) {
			return swal({
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
				return Meteor.call('removeUserFromRoom', { rid, username: user.username }, (err) => {
					if (err) {
						return handleError(err);
					}
					swal({
						title: t('Removed'),
						text: t('User_has_been_removed_from_s', room.name),
						type: 'success',
						timer: 2000,
						showConfirmButton: false
					});

					return instance.clear();
				});
			});
		} else {
			return toastr.error(TAPi18n.__('error-not-allowed'));
		}
	},

	'click .mute-user'(e, instance) {
		e.preventDefault();
		const rid = Session.get('openedRoom');
		const room = ChatRoom.findOne(rid);
		const user = instance.user.get();
		if (user && RocketChat.authz.hasAllPermission('mute-user', rid)) {
			return swal({
				title: t('Are_you_sure'),
				text: t('The_user_wont_be_able_to_type_in_s', room.name),
				type: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#DD6B55',
				confirmButtonText: t('Yes_mute_user'),
				cancelButtonText: t('Cancel'),
				closeOnConfirm: false,
				html: false
			}, () => {
				return Meteor.call('muteUserInRoom', { rid, username: user.username }, function(err) {
					if (err) {
						return handleError(err);
					}
					return swal({
						title: t('Muted'),
						text: t('User_has_been_muted_in_s', room.name),
						type: 'success',
						timer: 2000,
						showConfirmButton: false
					});
				});
			});
		}
	},

	'click .unmute-user'(e, t) {
		e.preventDefault();
		const rid = Session.get('openedRoom');
		const user = t.user.get();
		//const room = ChatRoom.findOne(rid); // never used
		if (user && RocketChat.authz.hasAllPermission('mute-user', rid)) {
			return Meteor.call('unmuteUserInRoom', { rid, username: user.username }, function(err) {
				if (err) {
					return handleError(err);
				}
				return toastr.success(TAPi18n.__('User_unmuted_in_room'));
			});
		} else {
			return toastr.error(TAPi18n.__('error-not-allowed'));
		}
	},

	'click .set-moderator'(e, t) {
		e.preventDefault();
		const user = t.user.get();
		if (user) {
			const userModerator = RoomRoles.findOne({ rid: Session.get('openedRoom'), 'u._id': user._id, roles: 'moderator' }, { fields: { _id: 1 } });
			if (userModerator == null) {
				return Meteor.call('addRoomModerator', Session.get('openedRoom'), user._id, (err) => {
					if (err) {
						return handleError(err);
					}

					const room = ChatRoom.findOne(Session.get('openedRoom'));
					return toastr.success(TAPi18n.__('User__username__is_now_a_moderator_of__room_name_', { username: this.username, room_name: room.name }));
				});
			}
		}
	},

	'click .unset-moderator'(e, t) {
		e.preventDefault();
		const user = t.user.get();
		if (user) {
			const userModerator = RoomRoles.findOne({ rid: Session.get('openedRoom'), 'u._id': user._id, roles: 'moderator' }, { fields: { _id: 1 } });
			if (userModerator != null) {
				return Meteor.call('removeRoomModerator', Session.get('openedRoom'), user._id, (err) => {
					if (err) {
						return handleError(err);
					}

					const room = ChatRoom.findOne(Session.get('openedRoom'));
					return toastr.success(TAPi18n.__('User__username__removed_from__room_name__moderators', { username: this.username, room_name: room.name }));
				});
			}
		}
	},

	'click .set-owner'(e, t) {
		e.preventDefault();
		const user = t.user.get();
		if (user) {
			const userOwner = RoomRoles.findOne({ rid: Session.get('openedRoom'), 'u._id': user._id, roles: 'owner' }, { fields: { _id: 1 } });
			if (userOwner == null) {
				return Meteor.call('addRoomOwner', Session.get('openedRoom'), user._id, (err) => {
					if (err) {
						return handleError(err);
					}

					const room = ChatRoom.findOne(Session.get('openedRoom'));
					return toastr.success(TAPi18n.__('User__username__is_now_a_owner_of__room_name_', { username: this.username, room_name: room.name }));
				});
			}
		}
	},

	'click .unset-owner'(e, t) {
		e.preventDefault();
		const user = t.user.get();
		if (user) {
			const userOwner = RoomRoles.findOne({ rid: Session.get('openedRoom'), 'u._id': user._id, roles: 'owner' }, { fields: { _id: 1 } });
			if (userOwner != null) {
				return Meteor.call('removeRoomOwner', Session.get('openedRoom'), user._id, (err) => {
					if (err) {
						return handleError(err);
					}

					const room = ChatRoom.findOne(Session.get('openedRoom'));
					return toastr.success(TAPi18n.__('User__username__removed_from__room_name__owners', { username: this.username, room_name: room.name }));
				});
			}
		}
	},

	'click .set-leader'(e, t) {
		e.preventDefault();
		const user = t.user.get();
		if (user) {
			const userLeader = RoomRoles.findOne({ rid: Session.get('openedRoom'), 'u._id': user._id, roles: 'leader' }, { fields: { _id: 1 } });
			if (userLeader == null) {
				return Meteor.call('addRoomLeader', Session.get('openedRoom'), user._id, (err) => {
					if (err) {
						return handleError(err);
					}

					const room = ChatRoom.findOne(Session.get('openedRoom'));
					return toastr.success(TAPi18n.__('User__username__is_now_a_leader_of__room_name_', { username: this.username, room_name: room.name }));
				});
			}
		}
	},

	'click .unset-leader'(e, t) {
		e.preventDefault();
		const user = t.user.get();
		if (user) {
			const userLeader = RoomRoles.findOne({ rid: Session.get('openedRoom'), 'u._id': user._id, roles: 'leader' }, { fields: { _id: 1 } });
			if (userLeader != null) {
				return Meteor.call('removeRoomLeader', Session.get('openedRoom'), user._id, (err) => {
					if (err) {
						return handleError(err);
					}

					const room = ChatRoom.findOne(Session.get('openedRoom'));
					return toastr.success(TAPi18n.__('User__username__removed_from__room_name__leaders', { username: this.username, room_name: room.name }));
				});
			}
		}
	},

	'click .deactivate'(e, instance) {
		e.stopPropagation();
		e.preventDefault();
		const user = instance.user.get();
		if (user) {
			return Meteor.call('setUserActiveStatus', user._id, false, function(error, result) {
				if (result) {
					toastr.success(t('User_has_been_deactivated'));
				}
				if (error) {
					return handleError(error);
				}
			});
		}
	},

	'click .activate'(e, instance) {
		e.stopPropagation();
		e.preventDefault();
		const user = instance.user.get();
		if (user) {
			return Meteor.call('setUserActiveStatus', user._id, true, function(error, result) {
				if (result) {
					toastr.success(t('User_has_been_activated'));
				}
				if (error) {
					return handleError(error);
				}
			});
		}
	},

	'click .make-admin'(e, instance) {
		e.stopPropagation();
		e.preventDefault();
		const user = instance.user.get();
		if (user) {
			return Meteor.call('setAdminStatus', user._id, true, function(error, result) {
				if (result) {
					toastr.success(t('User_is_now_an_admin'));
				}
				if (error) {
					return handleError(error);
				}
			});
		}
	},

	'click .remove-admin'(e, instance) {
		e.stopPropagation();
		e.preventDefault();
		const user = instance.user.get();
		if (user) {
			return Meteor.call('setAdminStatus', user._id, false, function(error, result) {
				if (result) {
					toastr.success(t('User_is_no_longer_an_admin'));
				}
				if (error) {
					return handleError(error);
				}
			});
		}
	},

	'click .delete'(e, instance) {
		e.stopPropagation();
		e.preventDefault();
		const user = instance.user.get();
		if (user) {
			return swal({
				title: t('Are_you_sure'),
				text: t('Delete_User_Warning'),
				type: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#DD6B55',
				confirmButtonText: t('Yes_delete_it'),
				cancelButtonText: t('Cancel'),
				closeOnConfirm: false,
				html: false
			}, function() {
				swal.disableButtons();
				return Meteor.call('deleteUser', user._id, function(error) {
					if (error) {
						handleError(error);
						return swal.enableButtons();
					} else {
						swal({
							title: t('Deleted'),
							text: t('User_has_been_deleted'),
							type: 'success',
							timer: 2000,
							showConfirmButton: false
						});

						return instance.tabBar.close();
					}
				});
			});
		}
	},

	'click .edit-user'(e, instance) {
		e.stopPropagation();
		e.preventDefault();
		const user = instance.user.get();
		if (user) {
			return instance.editingUser.set(user._id);
		}
	},

	'click .block-user'(e, instance) {
		e.stopPropagation();
		e.preventDefault();

		return Meteor.call('blockUser', { rid: Session.get('openedRoom'), blocked: instance.user.get()._id }, function(error, result) {
			if (result) {
				toastr.success(t('User_is_blocked'));
			}
			if (error) {
				return handleError(error);
			}
		});
	},

	'click .unblock-user'(e, instance) {
		e.stopPropagation();
		e.preventDefault();

		return Meteor.call('unblockUser', { rid: Session.get('openedRoom'), blocked: instance.user.get()._id }, function(error, result) {
			if (result) {
				toastr.success(t('User_is_unblocked'));
			}
			if (error) {
				return handleError(error);
			}
		});
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

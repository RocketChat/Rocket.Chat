import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';

import { getActions } from './userActions';
import { RoomManager, popover } from '../../../ui-utils/client';
import { ChatRoom, Subscriptions } from '../../../models/client';
import { settings } from '../../../settings/client';
import { t, isRtl, handleError, roomTypes, getUserAvatarURL } from '../../../utils/client';
import { WebRTC } from '../../../webrtc/client';
import { hasPermission } from '../../../authorization/client';

Template.membersList.helpers({
	ignored() {
		const { user } = this;
		const sub = Subscriptions.findOne({ rid: Session.get('openedRoom') });
		return sub && sub.ignored && sub.ignored.indexOf(user._id) > -1 ? `(${ t('Ignored') })` : '';
	},
	tAddUsers() {
		return t('Add_users');
	},

	isGroupChat() {
		const room = ChatRoom.findOne(this.rid, { reactive: false });
		return roomTypes.getConfig(room.t).isGroupChat(room);
	},

	isDirectChat() {
		return ChatRoom.findOne(this.rid, { reactive: false }).t === 'd';
	},

	roomUsers() {
		const onlineUsers = RoomManager.onlineUsers.get();
		const roomUsers = Template.instance().users.get();
		const room = ChatRoom.findOne(this.rid);
		const roomMuted = (room != null ? room.muted : undefined) || [];
		const roomUnmuted = (room != null ? room.unmuted : undefined) || [];
		const userUtcOffset = Meteor.user() && Meteor.user().utcOffset;
		let totalOnline = 0;
		let users = roomUsers;

		users = users.map(function(user) {
			let utcOffset;
			if (onlineUsers[user.username] != null) {
				totalOnline++;
				({ utcOffset } = onlineUsers[user.username]);

				if (utcOffset != null) {
					if (utcOffset === userUtcOffset) {
						utcOffset = '';
					} else if (utcOffset > 0) {
						utcOffset = `(UTC +${ utcOffset })`;
					} else {
						utcOffset = `(UTC ${ utcOffset })`;
					}
				}
			}

			const muted = (room.ro && !roomUnmuted.includes(user.username)) || roomMuted.includes(user.username);

			return {
				user,
				status: onlineUsers[user.username] != null ? onlineUsers[user.username].status : 'offline',
				muted,
				utcOffset,
			};
		});

		const usersTotal = users.length;
		const { total, loading, usersLimit, loadingMore } = Template.instance();
		const hasMore = loadingMore.get() || (usersTotal < total.get() && usersLimit.get() <= usersTotal);
		const totalShowing = usersTotal;

		return {
			_id: this.rid,
			total: total.get(),
			totalShowing,
			loading: loading.get(),
			totalOnline,
			users,
			hasMore,
			rid: this.rid,
		};
	},

	canAddUser() {
		const roomData = Session.get(`roomData${ this._id }`);
		if (!roomData) { return ''; }
		return (() => roomTypes.getConfig(roomData.t).canAddUser(roomData))();
	},

	canInviteUser() {
		return hasPermission('create-invite-links', this._id);
	},

	showUserInfo() {
		const webrtc = WebRTC.getInstanceByRoomId(this.rid);
		let videoActive = undefined;
		if (webrtc && webrtc.localUrl && webrtc.localUrl.get()) {
			videoActive = webrtc.localUrl.get();
		} else if (webrtc && webrtc.remoteItems && webrtc.remoteItems.get() && webrtc.remoteItems.get().length > 0) {
			videoActive = webrtc.remoteItems.get();
		}
		return Template.instance().showDetail.get() && !videoActive;
	},

	userInfoDetail() {
		const room = ChatRoom.findOne(this.rid, { fields: { t: 1, usernames: 1 } });

		return {
			tabBar: Template.currentData().tabBar,
			username: Template.instance().userDetail.get(),
			clear: Template.instance().clearUserDetail,
			showAll: roomTypes.getConfig(room.t).userDetailShowAll(room) || false,
			hideAdminControls: roomTypes.getConfig(room.t).userDetailShowAdmin(room) || false,
			video: ['d'].includes(room && room.t),
			showBackButton: roomTypes.getConfig(room.t).isGroupChat(room),
		};
	},
	displayName() {
		if (settings.get('UI_Use_Real_Name') && this.user.name) {
			return this.user.name;
		}

		return this.user.username;
	},

	loadingMore() {
		return Template.instance().loadingMore.get();
	},

	avatarUrl() {
		const { user: { username, avatarETag } } = this;
		return getUserAvatarURL(username, avatarETag);
	},
});

Template.membersList.events({
	'click .js-add'() {
		const { tabBar } = Template.currentData();

		tabBar.setTemplate('inviteUsers');
		tabBar.setData({
			label: 'Add_users',
			icon: 'user',
		});

		tabBar.open();
	},
	'click .js-invite'() {
		const { tabBar } = Template.currentData();
		tabBar.setTemplate('createInviteLink');
		tabBar.setData({
			label: 'Invite_Users',
			icon: 'user-plus',
		});

		tabBar.open();
	},
	'submit .js-search-form'(event) {
		event.preventDefault();
		event.stopPropagation();
	},
	'keydown .js-filter'(event, instance) {
		instance.filter.set(event.target.value.trim());
	},
	'input .js-filter'(e, instance) {
		instance.filter.set(e.target.value.trim());
	},
	'change .js-type'(e, instance) {
		instance.showAllUsers.set(e.currentTarget.value === 'all');
		instance.usersLimit.set(100);
	},
	'click .js-more'(e, instance) {
		e.currentTarget.parentElement.classList.add('active');
		const room = Session.get(`roomData${ instance.data.rid }`);
		const _actions = getActions({
			user: this.user.user,
			hideAdminControls: roomTypes.getConfig(room.t).userDetailShowAdmin(room) || false,
			directActions: roomTypes.getConfig(room.t).userDetailShowAll(room) || false,
		})
			.map((action) => (typeof action === 'function' ? action.call(this) : action))
			.filter((action) => action && (!action.condition || action.condition.call(this)));
		const groups = [];
		const columns = [];
		const admin = _actions.filter((action) => action.group === 'admin');
		const others = _actions.filter((action) => !action.group);
		const channel = _actions.filter((actions) => actions.group === 'channel');
		if (others.length) {
			groups.push({ items: others });
		}
		if (channel.length) {
			groups.push({ items: channel });
		}

		if (admin.length) {
			groups.push({ items: admin });
		}
		columns[0] = { groups };

		$(e.currentTarget).blur();
		e.preventDefault();
		const config = {
			columns,
			mousePosition: () => ({
				x: e.currentTarget.getBoundingClientRect().right + 10,
				y: e.currentTarget.getBoundingClientRect().bottom + 100,
			}),
			customCSSProperties: () => ({
				top: `${ e.currentTarget.getBoundingClientRect().bottom + 10 }px`,
				left: isRtl() ? `${ e.currentTarget.getBoundingClientRect().left - 10 }px` : undefined,
			}),
			data: {
				rid: this._id,
				username: instance.data.username,
				instance,
			},
			offsetHorizontal: 15,
			activeElement: e.currentTarget,
			currentTarget: e.currentTarget,
			onDestroyed: () => {
				e.currentTarget.parentElement.classList.remove('active');
			},
		};
		e.stopPropagation();
		popover.open(config);
	},
	'autocompleteselect #user-add-search'(event, template, doc) {
		const roomData = Session.get(`roomData${ template.data.rid }`);

		if (roomTypes.getConfig(roomData.t).canAddUser(roomData)) {
			return Meteor.call('addUserToRoom', { rid: roomData._id, username: doc.username }, function(error) {
				if (error) {
					return handleError(error);
				}

				return $('#user-add-search').val('');
			});
		}
	},

	'click .show-more-users'(e, instance) {
		const { showAllUsers, usersLimit, users, total, loadingMore, filter } = instance;

		loadingMore.set(true);
		Meteor.call('getUsersOfRoom', this.rid, showAllUsers.get(), { limit: usersLimit.get() + 100, skip: 0 }, filter.get(), (error, result) => {
			if (error) {
				console.error(error);
				loadingMore.set(false);
				return;
			}
			users.set(result.records);
			total.set(result.total);
			loadingMore.set(false);
		});

		usersLimit.set(usersLimit.get() + 100);
	},
});

Template.membersList.onCreated(function() {
	this.showAllUsers = new ReactiveVar(false);
	this.usersLimit = new ReactiveVar(100);
	this.userDetail = new ReactiveVar();
	this.showDetail = new ReactiveVar(false);
	this.filter = new ReactiveVar('');


	this.users = new ReactiveVar([]);
	this.total = new ReactiveVar();
	this.loading = new ReactiveVar(true);
	this.loadingMore = new ReactiveVar(false);

	this.tabBar = this.data.tabBar;

	this.autorun(() => {
		if (this.data.rid == null) { return; }
		this.loading.set(true);
		return Meteor.call('getUsersOfRoom', this.data.rid, this.showAllUsers.get(), { limit: 100, skip: 0 }, this.filter.get(), (error, users) => {
			if (error) {
				console.error(error);
				this.loading.set(false);
			}

			this.users.set(users.records);
			this.total.set(users.total);
			this.loading.set(false);
		});
	});

	this.clearUserDetail = () => {
		this.showDetail.set(false);
		this.tabBar.setData({
			label: 'Members',
			icon: 'team',
		});
		setTimeout(() => this.clearRoomUserDetail(), 100);
	};

	this.showUserDetail = (username, group) => {
		this.showDetail.set(!!username);
		this.userDetail.set(username);
		if (group) {
			this.showAllUsers.set(group === 'all');
		}
	};

	this.clearRoomUserDetail = this.data.clearUserDetail;

	this.autorun(() => {
		const { userDetail, groupDetail } = Template.currentData();

		this.showUserDetail(userDetail, groupDetail);
	});
});

Template.membersList.onRendered(function() {
	this.firstNode.parentNode.querySelector('#user-search').focus();
	this.autorun(() => {
		const showAllUsers = this.showAllUsers.get();
		const statusTypeSelect = this.find('.js-type');
		if (statusTypeSelect) {
			statusTypeSelect.value = showAllUsers ? 'all' : 'online';
		}
	});
});

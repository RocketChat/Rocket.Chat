/* globals WebRTC popover isRtl */
import _ from 'underscore';
import {getActions} from './userActions';

Template.membersList.helpers({
	tAddUsers() {
		return t('Add_users');
	},

	isGroupChat() {
		const room = ChatRoom.findOne(this.rid, { reactive: false });
		return RocketChat.roomTypes.roomTypes[room.t].isGroupChat();
	},

	isDirectChat() {
		return ChatRoom.findOne(this.rid, { reactive: false }).t === 'd';
	},

	seeAll() {
		if (Template.instance().showAllUsers.get()) {
			return t('Show_only_online');
		} else {
			return t('Show_all');
		}
	},

	roomUsers() {
		const onlineUsers = RoomManager.onlineUsers.get();
		const roomUsers = Template.instance().users.get();
		const room = ChatRoom.findOne(this.rid);
		const roomMuted = (room != null ? room.muted : undefined) || [];
		const userUtcOffset = Meteor.user() && Meteor.user().utcOffset;
		let totalOnline = 0;
		let users = roomUsers;

		const filter = Template.instance().filter.get();
		let reg = null;
		try {
			reg = new RegExp(filter, 'i');
		} catch (e) {
			console.log(e);
		}
		if (filter && reg) {
			users = users.filter(user => reg.test(user.username) || reg.test(user.name));
		}

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

			return {
				user,
				status: (onlineUsers[user.username] != null ? onlineUsers[user.username].status : undefined),
				muted: Array.from(roomMuted).includes(user.username),
				utcOffset
			};
		});

		if (RocketChat.settings.get('UI_Use_Real_Name')) {
			users = _.sortBy(users, u => u.user.name);
		} else {
			users = _.sortBy(users, u => u.user.username);
		}
		// show online users first.
		// sortBy is stable, so we can do this
		users = _.sortBy(users, u => u.status == null);

		let hasMore = undefined;
		const usersLimit = Template.instance().usersLimit.get();
		if (usersLimit) {
			hasMore = users.length > usersLimit;
			users = _.first(users, usersLimit);
		}
		const totalShowing = users.length;

		const ret = {
			_id: this.rid,
			total: Template.instance().total.get(),
			totalShowing,
			loading: Template.instance().loading.get(),
			totalOnline,
			users,
			hasMore
		};
		return ret;
	},

	canAddUser() {
		const roomData = Session.get(`roomData${ this._id }`);
		if (!roomData) { return ''; }
		return (() => {
			return RocketChat.roomTypes.roomTypes[roomData.t].canAddUser(roomData);
		})();
	},

	autocompleteSettingsAddUser() {
		return {
			limit: 10,
			// inputDelay: 300
			rules: [
				{
					collection: 'UserAndRoom',
					subscription: 'userAutocomplete',
					field: 'username',
					template: Template.userSearch,
					noMatchTemplate: Template.userSearchEmpty,
					matchAll: true,
					filter: {
						exceptions: [Meteor.user().username]
					},
					selector(match) {
						return { term: match };
					},
					sort: 'username'
				}
			]
		};
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
		const room = ChatRoom.findOne(this.rid, { fields: { t: 1 } });

		return {
			tabBar: Template.currentData().tabBar,
			username: Template.instance().userDetail.get(),
			clear: Template.instance().clearUserDetail,
			showAll: RocketChat.roomTypes.roomTypes[room.t].userDetailShowAll(room) || false,
			hideAdminControls: RocketChat.roomTypes.roomTypes[room.t].userDetailShowAdmin(room) || false,
			video: ['d'].includes(room != null ? room.t : undefined)
		};
	},
	displayName() {
		if (RocketChat.settings.get('UI_Use_Real_Name') && this.user.name) {
			return this.user.name;
		}

		return jQuery.trim(jQuery.parseHTML(this.user.username)[0].data);
	}});

Template.membersList.events({
	'click .js-add'() {
		Template.parentData(0).tabBar.setTemplate('inviteUsers');
		Template.parentData(0).tabBar.setData({
			label: 'Add_users',
			icon: 'user'
		});

		Template.parentData(0).tabBar.open();
	},
	'input .js-filter'(e, instance) {
		instance.filter.set(e.target.value.trim());
	},
	'change .js-type'(e, instance) {
		const seeAll = instance.showAllUsers.get();
		instance.showAllUsers.set(!seeAll);
	},
	'click .see-all'(e, instance) {
		const seeAll = instance.showAllUsers.get();
		instance.showAllUsers.set(!seeAll);

		if (!seeAll) {
			return instance.usersLimit.set(100);
		}

	},
	'click .js-action'(e, instance) {
		e.currentTarget.parentElement.classList.add('active');
		const room = Session.get(`roomData${ instance.data.rid }`);
		const _actions = getActions({
			user: this.user.user,
			hideAdminControls: RocketChat.roomTypes.roomTypes[room.t].userDetailShowAdmin(room) || false,
			directActions: RocketChat.roomTypes.roomTypes[room.t].userDetailShowAll(room) || false
		}).map(action => typeof action === 'function' ? action.call(this): action).filter(action => action && (!action.condition || action.condition.call(this)));
		const groups = [];
		const columns = [];
		const admin = _actions.filter(action => action.group === 'admin');
		const others = _actions.filter(action => !action.group);
		const channel = _actions.filter(actions => actions.group === 'channel');
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
			activeElement: e.currentTarget,
			onDestroyed:() => {
				e.currentTarget.parentElement.classList.remove('active');
			}
		};
		e.stopPropagation();
		popover.open(config);
	},
	'autocompleteselect #user-add-search'(event, template, doc) {

		const roomData = Session.get(`roomData${ template.data.rid }`);

		if (RocketChat.roomTypes.roomTypes[roomData.t].canAddUser(roomData)) {
			return Meteor.call('addUserToRoom', { rid: roomData._id, username: doc.username }, function(error) {
				if (error) {
					return handleError(error);
				}

				return $('#user-add-search').val('');
			});
		}
	},

	'click .show-more-users'(e, instance) {
		return instance.usersLimit.set(instance.usersLimit.get() + 100);
	}
});

Template.membersList.onCreated(function() {
	this.showAllUsers = new ReactiveVar(false);
	this.usersLimit = new ReactiveVar(100);
	this.userDetail = new ReactiveVar;
	this.showDetail = new ReactiveVar(false);
	this.filter = new ReactiveVar('');

	this.users = new ReactiveVar([]);
	this.total = new ReactiveVar;
	this.loading = new ReactiveVar(true);

	this.tabBar = Template.instance().tabBar;

	Tracker.autorun(() => {
		if (this.data.rid == null) { return; }

		this.loading.set(true);
		return Meteor.call('getUsersOfRoom', this.data.rid, this.showAllUsers.get(), (error, users) => {
			this.users.set(users.records);
			this.total.set(users.total);
			return this.loading.set(false);
		}
		);
	}
	);

	this.clearUserDetail = () => {
		this.showDetail.set(false);
		return setTimeout(() => {
			return this.clearRoomUserDetail();
		}, 500);
	};

	this.showUserDetail = username => {
		this.showDetail.set(username != null);
		return this.userDetail.set(username);
	};

	this.clearRoomUserDetail = this.data.clearUserDetail;

	return this.autorun(() => {
		const data = Template.currentData();
		return this.showUserDetail(data.userDetail);
	}
	);
});

import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { RoomManager, popover } from '../../../ui-utils';
import { ChatRoom, Subscriptions, RoomRoles, UserRoles } from '../../../models';
import { settings } from '../../../settings';
import { t, isRtl, handleError, roomTypes } from '../../../utils';
import { WebRTC } from '../../../webrtc/client';
import { getActions } from './userActions';

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
		return roomTypes.roomTypes[room.t].isGroupChat();
	},

	isDirectChat() {
		return ChatRoom.findOne(this.rid, { reactive: false }).t === 'd';
	},

	roomUsers() {
		const onlineUsers = RoomManager.onlineUsers.get();
		const roomUsers = Template.instance().users.get();
		const room = ChatRoom.findOne(this.rid);
		const roomMuted = (room != null ? room.muted : undefined) || [];
		const userUtcOffset = Meteor.user() && Meteor.user().utcOffset;
		const hierarchy = ['admin', 'owner', 'leader'];
		let totalOnline = 0;
		let users = roomUsers;
		

		let userRoles = [];
		let roomRoles = [];
		let roles = [];

		const filter = Template.instance().filter.get();
		let reg = null;
		try {
			reg = new RegExp(filter, 'i');
		} catch (e) {
			console.log(e);
		}
		if (filter && reg) {
			users = users.filter((user) => reg.test(user.username) || reg.test(user.name));
		}

		users = users.map(function(user) {
			let utcOffset;
			let rank;
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

			userRoles = UserRoles.findOne(user._id) || {};
			roomRoles = RoomRoles.findOne({ 'u._id': user._id, rid: Session.get('openedRoom') }) || {};
			roles = _.union(userRoles.roles || [], roomRoles.roles || []);
			roles = _.sortBy(roles, function(role) {				
				return (hierarchy.indexOf(role) === -1) ? 50 : hierarchy.indexOf(role);
			});

			if (roles.length !== 0) {
				rank = hierarchy.indexOf(roles[0]);
				if (rank === -1) {
					// user has some role assigned which is not a part of hierarchy
					rank = 100;
				}
			} else {
				// sending the ones without an assigned role at the end of list
				rank = 1000;
			}
			

			console.log(user.username, roles, rank);
			return {
				user,
				status: (onlineUsers[user.username] != null ? onlineUsers[user.username].status : 'offline'),
				muted: Array.from(roomMuted).includes(user.username),
				utcOffset,
				roles,
				rank,
			};
		});

		//if(document.getElementById('status-type').selectedIndex === 2) {
			users = _.sortBy(users, function(user) {
				return user.rank;
			});
		//}

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

	showUserRoles() {
		return (Template.instance().sortingMode.get() === 'showUserRoles');
	},

	canAddUser() {
		const roomData = Session.get(`roomData${ this._id }`);
		if (!roomData) { return ''; }
		return (() => roomTypes.roomTypes[roomData.t].canAddUser(roomData))();
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
						exceptions: [Meteor.user().username],
					},
					selector(match) {
						return { term: match };
					},
					sort: 'username',
				},
			],
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
			showAll: roomTypes.roomTypes[room.t].userDetailShowAll(room) || false,
			hideAdminControls: roomTypes.roomTypes[room.t].userDetailShowAdmin(room) || false,
			video: ['d'].includes(room && room.t),
			showBackButton: roomTypes.roomTypes[room.t].isGroupChat(),
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
});

Template.membersList.events({
	'click .js-add'() {
		Template.parentData(0).tabBar.setTemplate('inviteUsers');
		Template.parentData(0).tabBar.setData({
			label: 'Add_users',
			icon: 'user',
		});

		Template.parentData(0).tabBar.open();
	},
	'input .js-filter'(e, instance) {
		instance.filter.set(e.target.value.trim());
	},
	'change .js-type'(e, instance) {
		instance.showAllUsers.set(e.currentTarget.value === 'all');
		instance.usersLimit.set(100);
		instance.sortingMode.set(e.currentTarget.value);
	},
	'click .js-more'(e, instance) {
		e.currentTarget.parentElement.classList.add('active');
		const room = Session.get(`roomData${ instance.data.rid }`);
		const _actions = getActions({
			user: this.user.user,
			hideAdminControls: roomTypes.roomTypes[room.t].userDetailShowAdmin(room) || false,
			directActions: roomTypes.roomTypes[room.t].userDetailShowAll(room) || false,
		})
			.map((action) => (typeof action === 'function' ? action.call(this) : action))
			.filter((action) => action && (!action.condition || action.condition.call(this)));
		const groups = [];
		const columns = [];
		const admin = _actions.filter((action) => action.group === 'admin');
		const others = _actions.filter((action) => !action.group);
		const channel = _actions.filter((actions) => actions.group === 'channel');
		if (others.length) {
			groups.push({ items:others });
		}
		if (channel.length) {
			groups.push({ items:channel });
		}

		if (admin.length) {
			groups.push({ items:admin });
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
				top:  `${ e.currentTarget.getBoundingClientRect().bottom + 10 }px`,
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
			onDestroyed:() => {
				e.currentTarget.parentElement.classList.remove('active');
			},
		};
		e.stopPropagation();
		popover.open(config);
	},
	'autocompleteselect #user-add-search'(event, template, doc) {

		const roomData = Session.get(`roomData${ template.data.rid }`);

		if (roomTypes.roomTypes[roomData.t].canAddUser(roomData)) {
			return Meteor.call('addUserToRoom', { rid: roomData._id, username: doc.username }, function(error) {
				if (error) {
					return handleError(error);
				}

				return $('#user-add-search').val('');
			});
		}
	},

	'click .show-more-users'(e, instance) {
		const { showAllUsers, usersLimit, users, total, loadingMore } = instance;

		loadingMore.set(true);
		Meteor.call('getUsersOfRoom', this.rid, showAllUsers.get(), { limit: usersLimit.get() + 100, skip: 0 }, (error, result) => {
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
	this.userDetail = new ReactiveVar;
	this.showDetail = new ReactiveVar(false);
	this.filter = new ReactiveVar('');


	this.users = new ReactiveVar([]);
	this.total = new ReactiveVar;
	this.loading = new ReactiveVar(true);
	this.loadingMore = new ReactiveVar(false);
	this.sortingMode = new ReactiveVar('online');

	this.tabBar = this.data.tabBar;

	this.autorun(() => {
		if (this.data.rid == null) { return; }
		this.loading.set(true);
		return Meteor.call('getUsersOfRoom', this.data.rid, this.showAllUsers.get(), { limit: 100, skip: 0 }, (error, users) => {
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
			label: 'Members_List',
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
	this.autorun(() => {
		const showAllUsers = this.showAllUsers.get();
		const statusTypeSelect = this.find('.js-type');
		if (statusTypeSelect) {
			statusTypeSelect.value = showAllUsers ? 'all' : 'online';
		}
	});
});

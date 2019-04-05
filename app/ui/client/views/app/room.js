import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Random } from 'meteor/random';
import { Tracker } from 'meteor/tracker';
import { Blaze } from 'meteor/blaze';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { t, roomTypes, getUserPreference, handleError } from '../../../../utils';
import { WebRTC } from '../../../../webrtc/client';
import { ChatSubscription, ChatMessage, RoomRoles, Users, Subscriptions, Rooms } from '../../../../models';
import {
	fireGlobalEvent,
	RoomHistoryManager,
	RoomManager,
	readMessage,
	popover,
	modal,
	Layout,
	MessageAction,
	RocketChatTabBar,
} from '../../../../ui-utils';
import { settings } from '../../../../settings';
import { callbacks } from '../../../../callbacks';
import { promises } from '../../../../promises/client';
import { hasAllPermission, hasRole } from '../../../../authorization';
import _ from 'underscore';
import moment from 'moment';
import mime from 'mime-type/with-db';
import Clipboard from 'clipboard';
import { lazyloadtick } from '../../../../lazy-load';
import { ChatMessages } from '../../lib/chatMessages';
import { fileUpload } from '../../lib/fileUpload';

export const chatMessages = {};
const isSubscribed = (_id) => ChatSubscription.find({ rid: _id }).count() > 0;

const favoritesEnabled = () => settings.get('Favorite_Rooms');

const userCanDrop = (_id) => !roomTypes.readOnly(_id, Meteor.user());

const openProfileTab = (e, instance, username) => {
	const roomData = Session.get(`roomData${ Session.get('openedRoom') }`);

	if (Layout.isEmbedded()) {
		fireGlobalEvent('click-user-card-message', { username });
		e.preventDefault();
		e.stopPropagation();
		return;
	}

	if (roomTypes.roomTypes[roomData.t].enableMembersListProfile()) {
		instance.setUserDetail(username);
	}

	instance.tabBar.setTemplate('membersList');
	instance.tabBar.open();
};

const openProfileTabOrOpenDM = (e, instance, username) => {
	if (settings.get('UI_Click_Direct_Message')) {
		Meteor.call('createDirectMessage', username, (error, result) => {
			if (error) {
				if (error.isClientSafe) {
					openProfileTab(e, instance, username);
				} else {
					handleError(error);
				}
			}

			if ((result != null ? result.rid : undefined) != null) {
				FlowRouter.go('direct', { username }, FlowRouter.current().queryParams);
			}
		});
	} else {
		openProfileTab(e, instance, username);
	}
	e.stopPropagation();
};

const mountPopover = (e, i, outerContext) => {
	let context = $(e.target).parents('.message').data('context');
	if (!context) {
		context = 'message';
	}

	const [, message] = outerContext._arguments;

	let menuItems = MessageAction.getButtons(message, context, 'menu').map((item) => ({
		icon: item.icon,
		name: t(item.label),
		type: 'message-action',
		id: item.id,
		modifier: item.color,
	}));

	if (window.matchMedia('(max-width: 500px)').matches) {
		const messageItems = MessageAction.getButtons(message, context, 'message').map((item) => ({
			icon: item.icon,
			name: t(item.label),
			type: 'message-action',
			id: item.id,
			modifier: item.color,
		}));

		menuItems = menuItems.concat(messageItems);
	}

	const [items, deleteItem] = menuItems.reduce((result, value) => (result[value.id === 'delete-message' ? 1 : 0].push(value), result), [[], []]);
	const groups = [{ items }];

	if (deleteItem.length) {
		groups.push({ items: deleteItem });
	}

	const config = {
		columns: [
			{
				groups,
			},
		],
		instance: i,
		currentTarget: e.currentTarget,
		data: outerContext,
		activeElement: $(e.currentTarget).parents('.message')[0],
		onRendered: () => new Clipboard('.rc-popover__item'),
	};

	popover.open(config);
};

const wipeFailedUploads = () => {
	const uploads = Session.get('uploading');

	if (uploads) {
		Session.set('uploading', uploads.filter((upload) => !upload.error));
	}
};

function roomHasGlobalPurge(room) {
	if (!settings.get('RetentionPolicy_Enabled')) {
		return false;
	}

	switch (room.t) {
		case 'c':
			return settings.get('RetentionPolicy_AppliesToChannels');
		case 'p':
			return settings.get('RetentionPolicy_AppliesToGroups');
		case 'd':
			return settings.get('RetentionPolicy_AppliesToDMs');
	}
	return false;
}

function roomHasPurge(room) {
	if (!room || !settings.get('RetentionPolicy_Enabled')) {
		return false;
	}

	if (room.retention && room.retention.enabled !== undefined) {
		return room.retention.enabled;
	}

	return roomHasGlobalPurge(room);
}

function roomFilesOnly(room) {
	if (!room) {
		return false;
	}

	if (room.retention && room.retention.overrideGlobal) {
		return room.retention.filesOnly;
	}

	return settings.get('RetentionPolicy_FilesOnly');
}

function roomExcludePinned(room) {
	if (!room) {
		return false;
	}

	if (room.retention && room.retention.overrideGlobal) {
		return room.retention.excludePinned;
	}

	return settings.get('RetentionPolicy_ExcludePinned');
}

function roomMaxAge(room) {
	if (!room) {
		return;
	}
	if (!roomHasPurge(room)) {
		return;
	}

	if (room.retention && room.retention.overrideGlobal) {
		return room.retention.maxAge;
	}

	if (room.t === 'c') {
		return settings.get('RetentionPolicy_MaxAge_Channels');
	}
	if (room.t === 'p') {
		return settings.get('RetentionPolicy_MaxAge_Groups');
	}
	if (room.t === 'd') {
		return settings.get('RetentionPolicy_MaxAge_DMs');
	}
}

callbacks.add('enter-room', wipeFailedUploads);

Template.room.helpers({
	isTranslated() {
		const sub = ChatSubscription.findOne({ rid: this._id }, { fields: { autoTranslate: 1, autoTranslateLanguage: 1 } });
		return settings.get('AutoTranslate_Enabled') && ((sub != null ? sub.autoTranslate : undefined) === true) && (sub.autoTranslateLanguage != null);
	},

	embeddedVersion() {
		return Layout.isEmbedded();
	},

	subscribed() {
		return isSubscribed(this._id);
	},

	messagesHistory() {
		const hideMessagesOfType = [];
		settings.collection.find({ _id: /Message_HideType_.+/ }).forEach(function(record) {
			let types;
			const type = record._id.replace('Message_HideType_', '');
			switch (type) {
				case 'mute_unmute':
					types = ['user-muted', 'user-unmuted'];
					break;
				default:
					types = [type];
			}
			return types.forEach(function(type) {
				const index = hideMessagesOfType.indexOf(type);

				if ((record.value === true) && (index === -1)) {
					hideMessagesOfType.push(type);
				} else if (index > -1) {
					hideMessagesOfType.splice(index, 1);
				}
			});
		});

		const query =
			{ rid: this._id };

		if (hideMessagesOfType.length > 0) {
			query.t =
				{ $nin: hideMessagesOfType };
		}

		const options = {
			sort: {
				ts: 1,
			},
		};

		return ChatMessage.find(query, options);
	},

	hasMore() {
		return RoomHistoryManager.hasMore(this._id);
	},

	hasMoreNext() {
		return RoomHistoryManager.hasMoreNext(this._id);
	},

	isLoading() {
		return RoomHistoryManager.isLoading(this._id);
	},

	windowId() {
		return `chat-window-${ this._id }`;
	},

	uploading() {
		return Session.get('uploading');
	},

	roomLeader() {
		const roles = RoomRoles.findOne({ rid: this._id, roles: 'leader', 'u._id': { $ne: Meteor.userId() } });
		if (roles) {
			const leader = Users.findOne({ _id: roles.u._id }, { fields: { status: 1 } }) || {};
			return {
				...roles.u,
				name: settings.get('UI_Use_Real_Name') ? (roles.u.name || roles.u.username) : roles.u.username,
				status: leader.status || 'offline',
				statusDisplay: ((status) => status.charAt(0).toUpperCase() + status.slice(1))(leader.status || 'offline'),
			};
		}
	},

	chatNowLink() {
		return roomTypes.getRouteLink('d', { name: this.username });
	},

	showAnnouncement() {
		const roomData = Session.get(`roomData${ this._id }`);
		if (!roomData) { return false; }
		return roomData.announcement != null && roomData.announcement !== '';
	},

	messageboxData() {
		const instance = Template.instance();
		const { _id: rid } = this;
		const roomData = Session.get(`roomData${ rid }`);
		const subscription = ChatSubscription.findOne({
			rid,
		}, {
			fields: {
				archived: 1,
				blocked: 1,
				blocker: 1,
			},
		});
		const isAnonymous = !Meteor.userId();
		const mustJoinWithCode = !subscription && roomData && roomData.joinCodeRequired;
		const isReadOnly = roomTypes.readOnly(rid, Meteor.user());
		const isArchived = roomTypes.archived(rid) || (roomData && roomData.t === 'd' && subscription && subscription.archived);
		const isBlocked = (roomData && roomData.t === 'd' && subscription && subscription.blocked);
		const isBlocker = (roomData && roomData.t === 'd' && subscription && subscription.blocker);
		const isEmbedded = Layout.isEmbedded();
		const showFormattingTips = settings.get('Message_ShowFormattingTips');

		return {
			rid,
			isAnonymous,
			mustJoinWithCode,
			isReadOnly,
			isArchived,
			isBlocked,
			isBlocker,
			isEmbedded,
			showFormattingTips: showFormattingTips && !isEmbedded,
			onInputChanged: (input) => {
				if (!chatMessages[rid]) {
					return;
				}

				chatMessages[rid].input = input;
				chatMessages[rid].$input = $(input);

				if (input && window.matchMedia('screen and (min-device-width: 500px)').matches) {
					input.focus();
				}
			},
			onResize: () => {
				if (instance.sendToBottomIfNecessaryDebounced) {
					instance.sendToBottomIfNecessaryDebounced();
				}
			},
			onKeyUp: (...args) => chatMessages[rid] && chatMessages[rid].keyup.apply(chatMessages[rid], args),
			onKeyDown: (...args) => chatMessages[rid] && chatMessages[rid].keydown.apply(chatMessages[rid], args),
			onSend: (...args) => chatMessages[rid] && chatMessages[rid].send.apply(chatMessages[rid], args),
		};
	},

	roomAnnouncement() {
		const roomData = Session.get(`roomData${ this._id }`);
		if (!roomData) { return ''; }
		return roomData.announcement;
	},

	getAnnouncementStyle() {
		const roomData = Session.get(`roomData${ this._id }`);
		if (!roomData) { return ''; }
		return roomData.announcementDetails && roomData.announcementDetails.style !== undefined ? roomData.announcementDetails.style : '';
	},

	roomIcon() {
		const roomData = Session.get(`roomData${ this._id }`);
		if (!(roomData != null ? roomData.t : undefined)) { return ''; }

		const roomIcon = roomTypes.getIcon(roomData);

		// Remove this 'codegueira' on header redesign
		if (!roomIcon) {
			return 'at';
		}

		return roomIcon;
	},

	userStatus() {
		const roomData = Session.get(`roomData${ this._id }`);
		return roomTypes.getUserStatus(roomData.t, this._id) || 'offline';
	},

	maxMessageLength() {
		return settings.get('Message_MaxAllowedSize');
	},

	unreadData() {
		const data =
			{ count: RoomHistoryManager.getRoom(this._id).unreadNotLoaded.get() + Template.instance().unreadCount.get() };

		const room = RoomManager.getOpenedRoomByRid(this._id);
		if (room != null) {
			data.since = room.unreadSince != null ? room.unreadSince.get() : undefined;
		}

		return data;
	},

	containerBarsShow(unreadData, uploading) {
		const hasUnreadData = unreadData && (unreadData.count && unreadData.since);
		const isUploading = uploading && uploading.length;

		if (hasUnreadData || isUploading) {
			return 'show';
		}
	},

	formatUnreadSince() {
		if ((this.since == null)) { return; }

		return moment(this.since).calendar(null, { sameDay: 'LT' });
	},

	flexData() {
		const flexData = {
			tabBar: Template.instance().tabBar,
			data: {
				rid: this._id,
				userDetail: Template.instance().userDetail.get(),
				clearUserDetail: Template.instance().clearUserDetail,
			},
		};

		return flexData;
	},

	adminClass() {
		if (hasRole(Meteor.userId(), 'admin')) { return 'admin'; }
	},

	showToggleFavorite() {
		if (isSubscribed(this._id) && favoritesEnabled()) { return true; }
	},

	messageViewMode() {
		const viewMode = getUserPreference(Meteor.userId(), 'messageViewMode');
		const modes = ['', 'cozy', 'compact'];
		return modes[viewMode] || modes[0];
	},

	selectable() {
		return Template.instance().selectable.get();
	},

	hideUsername() {
		return getUserPreference(Meteor.userId(), 'hideUsernames') ? 'hide-usernames' : undefined;
	},

	hideAvatar() {
		return getUserPreference(Meteor.userId(), 'hideAvatars') ? 'hide-avatars' : undefined;
	},

	userCanDrop() {
		return userCanDrop(this._id);
	},

	toolbarButtons() {
		const toolbar = Session.get('toolbarButtons') || { buttons: {} };
		const buttons = Object.keys(toolbar.buttons).map((key) => ({
			id: key,
			...toolbar.buttons[key],
		}));
		return { buttons };
	},

	canPreview() {
		const room = Session.get(`roomData${ this._id }`);
		if (room && room.t !== 'c') {
			return true;
		}

		if (settings.get('Accounts_AllowAnonymousRead') === true) {
			return true;
		}

		if (hasAllPermission('preview-c-room')) {
			return true;
		}

		return (Subscriptions.findOne({ rid: this._id }) != null);

	},
	hideLeaderHeader() {
		return Template.instance().hideLeaderHeader.get() ? 'animated-hidden' : '';
	},
	hasLeader() {
		if (RoomRoles.findOne({ rid: this._id, roles: 'leader', 'u._id': { $ne: Meteor.userId() } }, { fields: { _id: 1 } })) {
			return 'has-leader';
		}
	},
	hasPurge() {
		return roomHasPurge(Session.get(`roomData${ this._id }`));
	},
	filesOnly() {
		return roomFilesOnly(Session.get(`roomData${ this._id }`));
	},
	excludePinned() {
		return roomExcludePinned(Session.get(`roomData${ this._id }`));
	},
	purgeTimeout() {
		moment.relativeTimeThreshold('s', 60);
		moment.relativeTimeThreshold('ss', 0);
		moment.relativeTimeThreshold('m', 60);
		moment.relativeTimeThreshold('h', 24);
		moment.relativeTimeThreshold('d', 31);
		moment.relativeTimeThreshold('M', 12);

		return moment.duration(roomMaxAge(Session.get(`roomData${ this._id }`)) * 1000 * 60 * 60 * 24).humanize();
	},
});

let isSocialSharingOpen = false;
let touchMoved = false;
let lastTouchX = null;
let lastTouchY = null;
let lastScrollTop;

Template.room.events({
	'click .js-reply-broadcast'() {
		const message = this._arguments[1];
		roomTypes.openRouteLink('d', { name: this._arguments[1].u.username }, { ...FlowRouter.current().queryParams, reply: message._id });
	},
	'click, touchend'(e, t) {
		Meteor.setTimeout(() => t.sendToBottomIfNecessaryDebounced && t.sendToBottomIfNecessaryDebounced(), 100);
	},

	'click .messages-container-main'() {
		if (Template.instance().tabBar.getState() === 'opened' && getUserPreference(Meteor.userId(), 'hideFlexTab')) {
			Template.instance().tabBar.close();
		}
	},

	'touchstart .message'(e, t) {
		const { touches } = e.originalEvent;
		if (touches && touches.length) {
			lastTouchX = touches[0].pageX;
			lastTouchY = touches[0].pagey;
		}
		touchMoved = false;
		isSocialSharingOpen = false;
		if (e.originalEvent.touches.length !== 1) {
			return;
		}

		if ($(e.currentTarget).hasClass('system')) {
			return;
		}

		if (e.target && (e.target.nodeName === 'AUDIO')) {
			return;
		}

		if (e.target && (e.target.nodeName === 'A') && /^https?:\/\/.+/.test(e.target.getAttribute('href'))) {
			e.preventDefault();
			e.stopPropagation();
		}

		const doLongTouch = () => {
			console.log('long press');
			mountPopover(e, t, this);
		};

		Meteor.clearTimeout(t.touchtime);
		t.touchtime = Meteor.setTimeout(doLongTouch, 500);
	},

	'click .message img'(e, t) {
		Meteor.clearTimeout(t.touchtime);
		if ((isSocialSharingOpen === true) || (touchMoved === true)) {
			e.preventDefault();
			e.stopPropagation();
		}
	},

	'touchend .message'(e, t) {
		Meteor.clearTimeout(t.touchtime);
		if (isSocialSharingOpen === true) {
			e.preventDefault();
			e.stopPropagation();
			return;
		}

		if (e.target && (e.target.nodeName === 'A') && /^https?:\/\/.+/.test(e.target.getAttribute('href'))) {
			if (touchMoved === true) {
				e.preventDefault();
				e.stopPropagation();
				return;
			}

			window.open(e.target.href);
		}
	},

	'touchmove .message'(e, t) {
		const { touches } = e.originalEvent;
		if (touches && touches.length) {
			const deltaX = Math.abs(lastTouchX - touches[0].pageX);
			const deltaY = Math.abs(lastTouchY - touches[0].pageY);
			if (deltaX > 5 || deltaY > 5) {
				touchMoved = true;
			}
		}
		Meteor.clearTimeout(t.touchtime);
	},

	'touchcancel .message'(e, t) {
		Meteor.clearTimeout(t.touchtime);
	},

	'click .upload-progress-close'(e) {
		e.preventDefault();
		Session.set(`uploading-cancel-${ this.id }`, true);
	},

	'click .unread-bar > button.mark-read'() {
		readMessage.readNow(true);
	},

	'click .unread-bar > button.jump-to'(e, t) {
		const { _id } = t.data;
		const room = RoomHistoryManager.getRoom(_id);
		let message = room && room.firstUnread.get();
		if (message) {
			RoomHistoryManager.getSurroundingMessages(message, 50);
		} else {
			const subscription = ChatSubscription.findOne({ rid: _id });
			message = ChatMessage.find({ rid: _id, ts: { $gt: (subscription != null ? subscription.ls : undefined) } }, { sort: { ts: 1 }, limit: 1 }).fetch()[0];
			RoomHistoryManager.getSurroundingMessages(message, 50);
		}
	},

	'click .toggle-favorite'(event) {
		event.stopPropagation();
		event.preventDefault();
		Meteor.call('toggleFavorite', this._id, !$('i', event.currentTarget).hasClass('favorite-room'), function(err) {
			if (err) {
				handleError(err);
			}
		});
	},

	'click .edit-room-title'(event) {
		event.preventDefault();
		Session.set('editRoomTitle', true);
		$('.fixed-title').addClass('visible');
		Meteor.setTimeout(() => $('#room-title-field').focus().select(), 10);
	},

	'click .user-image, click .rc-member-list__user'(e, instance) {
		if (!Meteor.userId()) {
			return;
		}

		openProfileTabOrOpenDM(e, instance, this.user.username);
	},

	'click .user-card-message'(e, instance) {
		if (!Meteor.userId() || !this._arguments) {
			return;
		}

		const { username } = this._arguments[1].u;

		openProfileTabOrOpenDM(e, instance, username);
	},

	'scroll .wrapper': _.throttle(function(e, t) {
		lazyloadtick();

		const $roomLeader = $('.room-leader');
		if ($roomLeader.length) {
			if (e.target.scrollTop < lastScrollTop) {
				t.hideLeaderHeader.set(false);
			} else if (t.isAtBottom(100) === false && e.target.scrollTop > $('.room-leader').height()) {
				t.hideLeaderHeader.set(true);
			}
		}
		lastScrollTop = e.target.scrollTop;

		const isLoading = RoomHistoryManager.isLoading(this._id);
		const hasMore = RoomHistoryManager.hasMore(this._id);
		const hasMoreNext = RoomHistoryManager.hasMoreNext(this._id);

		if ((isLoading === false && hasMore === true) || hasMoreNext === true) {
			if (hasMore === true && e.target.scrollTop === 0) {
				RoomHistoryManager.getMore(this._id);
			} else if (hasMoreNext === true && Math.ceil(e.target.scrollTop) >= e.target.scrollHeight - e.target.clientHeight) {
				RoomHistoryManager.getMoreNext(this._id);
			}
		}
	}, 200),

	'click .new-message'(event, instance) {
		instance.atBottom = true;
		chatMessages[RoomManager.openedRoom].input.focus();
	},
	'click .message-actions__menu'(e, i) {
		let context = $(e.target).parents('.message').data('context');
		if (!context) {
			context = 'message';
		}

		const [, message] = this._arguments;
		const allItems = MessageAction.getButtons(message, context, 'menu').map((item) => ({
			icon: item.icon,
			name: t(item.label),
			type: 'message-action',
			id: item.id,
			modifier: item.color,
		}));
		const [items, deleteItem] = allItems.reduce((result, value) => (result[value.id === 'delete-message' ? 1 : 0].push(value), result), [[], []]);
		const groups = [{ items }];

		if (deleteItem.length) {
			groups.push({ items: deleteItem });
		}

		const config = {
			columns: [
				{
					groups,
				},
			],
			instance: i,
			data: this,
			currentTarget: e.currentTarget,
			activeElement: $(e.currentTarget).parents('.message')[0],
			onRendered: () => new Clipboard('.rc-popover__item'),
		};

		popover.open(config);
	},
	'click .time a'(e) {
		e.preventDefault();
		const repliedMessageId = this._arguments[1].attachments[0].message_link.split('?msg=')[1];
		FlowRouter.go(FlowRouter.current().context.pathname, null, { msg: repliedMessageId, hash: Random.id() });
	},
	'click .mention-link'(e, instance) {
		if (!Meteor.userId()) {
			return;
		}
		const channel = $(e.currentTarget).data('channel');
		if (channel) {
			if (Layout.isEmbedded()) {
				fireGlobalEvent('click-mention-link', { path: FlowRouter.path('channel', { name: channel }), channel });
			}
			FlowRouter.goToRoomById(channel);
			return;
		}
		const username = $(e.currentTarget).data('username');

		openProfileTabOrOpenDM(e, instance, username);
	},

	'click .image-to-download'(event) {
		ChatMessage.update({ _id: this._arguments[1]._id, 'urls.url': $(event.currentTarget).data('url') }, { $set: { 'urls.$.downloadImages': true } });
		ChatMessage.update({ _id: this._arguments[1]._id, 'attachments.image_url': $(event.currentTarget).data('url') }, { $set: { 'attachments.$.downloadImages': true } });
	},

	'click .collapse-switch'(e) {
		const index = $(e.currentTarget).data('index');
		const collapsed = $(e.currentTarget).data('collapsed');
		const id = this._arguments[1]._id;

		if ((this._arguments[1] != null ? this._arguments[1].attachments : undefined) != null) {
			ChatMessage.update({ _id: id }, { $set: { [`attachments.${ index }.collapsed`]: !collapsed } });
		}

		if ((this._arguments[1] != null ? this._arguments[1].urls : undefined) != null) {
			ChatMessage.update({ _id: id }, { $set: { [`urls.${ index }.collapsed`]: !collapsed } });
		}
	},

	'dragenter .dropzone'(e) {
		const types = e.originalEvent && e.originalEvent.dataTransfer && e.originalEvent.dataTransfer.types;
		if (types != null && types.length > 0 && _.every(types, (type) => type.indexOf('text/') === -1 || type.indexOf('text/uri-list') !== -1) && userCanDrop(this._id)) {
			e.currentTarget.classList.add('over');
		}
	},

	'dragleave .dropzone-overlay'(e) {
		e.currentTarget.parentNode.classList.remove('over');
	},

	'dragover .dropzone-overlay'(e) {
		e = e.originalEvent || e;
		if (['move', 'linkMove'].includes(e.dataTransfer.effectAllowed)) {
			e.dataTransfer.dropEffect = 'move';
		} else {
			e.dataTransfer.dropEffect = 'copy';
		}
	},

	'dropped .dropzone-overlay'(event) {
		event.currentTarget.parentNode.classList.remove('over');

		const e = event.originalEvent || event;
		const files = (e.dataTransfer != null ? e.dataTransfer.files : undefined) || [];

		const filesToUpload = [];
		for (const file of Array.from(files)) {
			// `file.type = mime.lookup(file.name)` does not work.
			Object.defineProperty(file, 'type', { value: mime.lookup(file.name) });
			filesToUpload.push({
				file,
				name: file.name,
			});
		}

		fileUpload(filesToUpload, chatMessages[RoomManager.openedRoom].input, RoomManager.openedRoom);
	},

	'load img'(e, template) {
		return (typeof template.sendToBottomIfNecessary === 'function' ? template.sendToBottomIfNecessary() : undefined);
	},

	'click .jump-recent button'(e, template) {
		e.preventDefault();
		template.atBottom = true;
		RoomHistoryManager.clear(template && template.data && template.data._id);
	},

	'click .message'(e, template) {
		if (template.selectable.get()) {
			(document.selection != null ? document.selection.empty() : undefined) || (typeof window.getSelection === 'function' ? window.getSelection().removeAllRanges() : undefined);
			const data = Blaze.getData(e.currentTarget);
			const _id = data && data._arguments && data._arguments[1] && data._arguments[1]._id;

			if (!template.selectablePointer) {
				template.selectablePointer = _id;
			}

			if (!e.shiftKey) {
				template.selectedMessages = template.getSelectedMessages();
				template.selectedRange = [];
				template.selectablePointer = _id;
			}

			template.selectMessages(_id);

			const selectedMessages = $('.messages-box .message.selected').map((i, message) => message.id);
			const removeClass = _.difference(selectedMessages, template.getSelectedMessages());
			const addClass = _.difference(template.getSelectedMessages(), selectedMessages);
			removeClass.forEach((message) => $(`.messages-box #${ message }`).removeClass('selected'));
			addClass.forEach((message) => $(`.messages-box #${ message }`).addClass('selected'));
		}
	},
	'click .announcement'() {
		const roomData = Session.get(`roomData${ this._id }`);
		if (!roomData) { return false; }
		if (roomData.announcementDetails != null && roomData.announcementDetails.callback != null) {
			return callbacks.run(roomData.announcementDetails.callback, this._id);
		} else {
			modal.open({
				title: t('Announcement'),
				text: roomData.announcement,
				showConfirmButton: false,
				showCancelButton: true,
				cancelButtonText: t('Close'),
			});
		}
	},
	'click .toggle-hidden'(e) {
		const id = e.currentTarget.dataset.message;
		document.querySelector(`#${ id }`).classList.toggle('message--ignored');
	},
	'click .js-actionButton-sendMessage'(event, instance) {
		const rid = instance.data._id;
		const msg = event.currentTarget.value;
		const msgObject = { _id: Random.id(), rid, msg };
		if (!msg) {
			return;
		}
		promises.run('onClientBeforeSendMessage', msgObject).then((msgObject) => {
			const _chatMessages = chatMessages[rid];
			if (_chatMessages && _chatMessages.processSlashCommand(msgObject)) {
				return;
			}

			Meteor.call('sendMessage', msgObject);
		});
	},
	'click .js-actionButton-respondWithMessage'(event) {
		const msg = event.currentTarget.value;
		if (!msg) {
			return;
		}

		const { input } = chatMessages[RoomManager.openedRoom];
		input.value = msg;
		input.focus();
	},
	'click .js-navigate-to-discussion'(event) {
		event.preventDefault();
		const [, { drid }] = this._arguments;
		FlowRouter.goToRoomById(drid);
	},
});


Template.room.onCreated(function() {
	// this.scrollOnBottom = true
	// this.typing = new msgTyping this.data._id

	lazyloadtick();

	this.showUsersOffline = new ReactiveVar(false);
	this.atBottom = !FlowRouter.getQueryParam('msg');
	this.unreadCount = new ReactiveVar(0);

	this.selectable = new ReactiveVar(false);
	this.selectedMessages = [];
	this.selectedRange = [];
	this.selectablePointer = null;

	this.flexTemplate = new ReactiveVar;

	this.userDetail = new ReactiveVar(FlowRouter.getParam('username'));

	this.tabBar = new RocketChatTabBar();
	this.tabBar.showGroup(FlowRouter.current().route.name);

	this.hideLeaderHeader = new ReactiveVar(false);

	this.resetSelection = (enabled) => {
		this.selectable.set(enabled);
		$('.messages-box .message.selected').removeClass('selected');
		this.selectedMessages = [];
		this.selectedRange = [];
		this.selectablePointer = null;
	};

	this.selectMessages = (to) => {
		if ((this.selectablePointer === to) && (this.selectedRange.length > 0)) {
			this.selectedRange = [];
		} else {
			const message1 = ChatMessage.findOne(this.selectablePointer);
			const message2 = ChatMessage.findOne(to);

			const minTs = _.min([message1.ts, message2.ts]);
			const maxTs = _.max([message1.ts, message2.ts]);

			this.selectedRange = _.pluck(ChatMessage.find({ rid: message1.rid, ts: { $gte: minTs, $lte: maxTs } }).fetch(), '_id');
		}
	};

	this.getSelectedMessages = () => {
		let previewMessages;
		const messages = this.selectedMessages;
		let addMessages = false;
		for (const message of Array.from(this.selectedRange)) {
			if (messages.indexOf(message) === -1) {
				addMessages = true;
				break;
			}
		}

		if (addMessages) {
			previewMessages = _.compact(_.uniq(this.selectedMessages.concat(this.selectedRange)));
		} else {
			previewMessages = _.compact(_.difference(this.selectedMessages, this.selectedRange));
		}

		return previewMessages;
	};

	this.setUserDetail = (username) => {
		this.userDetail.set(username);
	};

	this.clearUserDetail = () => {
		this.userDetail.set(null);
	};

	Meteor.call('getRoomRoles', this.data._id, function(error, results) {
		if (error) {
			handleError(error);
		}

		return Array.from(results).forEach((record) => {
			delete record._id;
			RoomRoles.upsert({ rid: record.rid, 'u._id': record.u._id }, record);
		});
	});
	RoomRoles.find({ rid: this.data._id }).observe({
		added: (role) => {
			if (!role.u || !role.u._id) {
				return;
			}
			ChatMessage.update({ rid: this.data._id, 'u._id': role.u._id }, { $addToSet: { roles: role._id } }, { multi: true });
		}, // Update message to re-render DOM
		changed: (role) => {
			if (!role.u || !role.u._id) {
				return;
			}
			ChatMessage.update({ rid: this.data._id, 'u._id': role.u._id }, { $inc: { rerender: 1 } }, { multi: true });
		}, // Update message to re-render DOM
		removed: (role) => {
			if (!role.u || !role.u._id) {
				return;
			}
			ChatMessage.update({ rid: this.data._id, 'u._id': role.u._id }, { $pull: { roles: role._id } }, { multi: true });
		},
	});

	this.sendToBottomIfNecessary = () => {};
}); // Update message to re-render DOM

Template.room.onDestroyed(function() {
	if (this.messageObserver) {
		this.messageObserver.stop();
	}
	window.removeEventListener('resize', this.onWindowResize);
});

Template.room.onRendered(function() {
	const rid = Session.get('openedRoom');
	if (!chatMessages[rid]) {
		chatMessages[rid] = new ChatMessages;
	}
	chatMessages[rid].init(this.firstNode);
	chatMessages[rid].restoreText(rid);

	if (chatMessages[rid].input && window.matchMedia('screen and (min-device-width: 500px)').matches) {
		chatMessages[rid].input.focus();
	}

	const wrapper = this.find('.wrapper');
	const wrapperUl = this.find('.wrapper > ul');
	const newMessage = this.find('.new-message');

	const template = this;

	const messageBox = $('.messages-box');

	template.isAtBottom = function(scrollThreshold = 0) {
		if (wrapper.scrollTop + scrollThreshold >= wrapper.scrollHeight - wrapper.clientHeight) {
			newMessage.className = 'new-message background-primary-action-color color-content-background-color not';
			return true;
		}
		return false;
	};

	template.sendToBottom = function() {
		wrapper.scrollTop = wrapper.scrollHeight - wrapper.clientHeight;
		newMessage.className = 'new-message background-primary-action-color color-content-background-color not';
	};

	template.checkIfScrollIsAtBottom = function() {
		template.atBottom = template.isAtBottom(100);
		readMessage.enable();
		readMessage.read();
	};

	template.sendToBottomIfNecessary = function() {
		if (template.atBottom === true && template.isAtBottom() !== true) {
			template.sendToBottom();
		}

		lazyloadtick();
	};

	template.sendToBottomIfNecessaryDebounced = _.debounce(template.sendToBottomIfNecessary, 10);

	template.sendToBottomIfNecessary();

	if ((window.MutationObserver == null)) {
		wrapperUl.addEventListener('DOMSubtreeModified', () => template.sendToBottomIfNecessaryDebounced());
	} else {
		const observer = new MutationObserver(() => template.sendToBottomIfNecessaryDebounced());

		observer.observe(wrapperUl, { childList: true });
	}
	// observer.disconnect()

	template.onWindowResize = () =>
		Meteor.defer(() => template.sendToBottomIfNecessaryDebounced())
	;

	window.addEventListener('resize', template.onWindowResize);

	wrapper.addEventListener('mousewheel', function() {
		template.atBottom = false;
		Meteor.defer(() => template.checkIfScrollIsAtBottom());
	});

	wrapper.addEventListener('wheel', function() {
		template.atBottom = false;
		Meteor.defer(() => template.checkIfScrollIsAtBottom());
	});

	wrapper.addEventListener('touchstart', () => template.atBottom = false);

	wrapper.addEventListener('touchend', function() {
		Meteor.defer(() => template.checkIfScrollIsAtBottom());
		Meteor.setTimeout(() => template.checkIfScrollIsAtBottom(), 1000);
		Meteor.setTimeout(() => template.checkIfScrollIsAtBottom(), 2000);
	});

	wrapper.addEventListener('scroll', function() {
		template.atBottom = false;
		Meteor.defer(() => template.checkIfScrollIsAtBottom());
	});

	$('.flex-tab-bar').on('click', (/* e, t*/) =>
		Meteor.setTimeout(() => template.sendToBottomIfNecessaryDebounced(), 50)
	);
	lastScrollTop = $('.messages-box .wrapper').scrollTop();

	const rtl = $('html').hasClass('rtl');

	const getElementFromPoint = function(topOffset = 0) {
		const messageBoxOffset = messageBox.offset();

		let element;
		if (rtl) {
			element = document.elementFromPoint((messageBoxOffset.left + messageBox.width()) - 1, messageBoxOffset.top + topOffset + 1);
		} else {
			element = document.elementFromPoint(messageBoxOffset.left + 1, messageBoxOffset.top + topOffset + 1);
		}

		if (element && element.classList.contains('message')) {
			return element;
		}
	};

	const updateUnreadCount = _.throttle(function() {
		const lastInvisibleMessageOnScreen = getElementFromPoint(0) || getElementFromPoint(20) || getElementFromPoint(40);

		if (lastInvisibleMessageOnScreen == null || lastInvisibleMessageOnScreen.id == null) {
			return template.unreadCount.set(0);
		}

		const lastMessage = ChatMessage.findOne(lastInvisibleMessageOnScreen.id);
		if (lastMessage == null) {
			return template.unreadCount.set(0);
		}

		const subscription = ChatSubscription.findOne({ rid: template.data._id }, { reactive: false });
		const count = ChatMessage.find({ rid: template.data._id, ts: { $lte: lastMessage.ts, $gt: subscription && subscription.ls } }).count();
		template.unreadCount.set(count);
	}, 300);

	readMessage.onRead(function(rid) {
		if (rid === template.data._id) {
			template.unreadCount.set(0);
		}
	});

	wrapper.addEventListener('scroll', () => updateUnreadCount());
	// salva a data da renderização para exibir alertas de novas mensagens
	$.data(this.firstNode, 'renderedAt', new Date);

	const webrtc = WebRTC.getInstanceByRoomId(template.data._id);
	if (webrtc != null) {
		Tracker.autorun(() => {
			const remoteItems = webrtc.remoteItems.get();
			if (remoteItems && remoteItems.length > 0) {
				this.tabBar.setTemplate('membersList');
				this.tabBar.open();
			}

			if (webrtc.localUrl.get() != null) {
				this.tabBar.setTemplate('membersList');
				this.tabBar.open();
			}
		});
	}
	callbacks.add('streamMessage', (msg) => {
		if (rid !== msg.rid || msg.editedAt) {
			return;
		}
		if (!template.isAtBottom()) {
			newMessage.classList.remove('not');
		}
	});

	this.autorun(function() {

		if (template.data._id !== RoomManager.openedRoom) {
			return;
		}

		const room = Rooms.findOne({ _id: template.data._id });
		if (!room) {
			FlowRouter.go('home');
		}
	});

});

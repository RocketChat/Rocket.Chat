/* globals RocketChatTabBar , fileUpload , fireGlobalEvent , mobileMessageMenu , cordova , readMessage , RoomRoles*/
import moment from 'moment';
import mime from 'mime-type/with-db';


const socialSharing = (options = {}) => window.plugins.socialsharing.share(options.message, options.subject, options.file, options.link);

const isSubscribed = _id => ChatSubscription.find({ rid: _id }).count() > 0;

const favoritesEnabled = () => RocketChat.settings.get('Favorite_Rooms');

const userCanDrop = _id => !RocketChat.roomTypes.readOnly(_id, Meteor.user());

const openProfileTab = (e, instance, username) => {
	const roomData = Session.get(`roomData${ Session.get('openedRoom') }`);

	if (RocketChat.Layout.isEmbedded()) {
		fireGlobalEvent('click-user-card-message', { username });
		e.preventDefault();
		e.stopPropagation();
		return;
	}

	if (['c', 'p', 'd', 'e', 'r'].includes(roomData.t)) {
		instance.setUserDetail(username);
	}

	instance.tabBar.setTemplate('membersList');
	return instance.tabBar.open();
};

const openProfileTabOrOpenDM = (e, instance, username) => {
	if (RocketChat.settings.get('UI_Click_Direct_Message')) {
		return Meteor.call('createDirectMessage', username, (error, result) => {
			if (error) {
				if (error.isClientSafe) {
					openProfileTab(e, instance, username);
				} else {
					return handleError(error);
				}
			}

			if ((result != null ? result.rid : undefined) != null) {
				return FlowRouter.go('direct', { username }, FlowRouter.current().queryParams);
			}
		});
	} else {
		openProfileTab(e, instance, username);
	}
};

Template.room.helpers({
	isTranslated() {
		const sub = ChatSubscription.findOne({ rid: this._id }, { fields: { autoTranslate: 1, autoTranslateLanguage: 1 } });
		return RocketChat.settings.get('AutoTranslate_Enabled') && ((sub != null ? sub.autoTranslate : undefined) === true) && (sub.autoTranslateLanguage != null);
	},

	embeddedVersion() {
		return RocketChat.Layout.isEmbedded();
	},

	favorite() {
		const sub = ChatSubscription.findOne({ rid: this._id }, { fields: { f: 1 } });
		if (((sub != null ? sub.f : undefined) != null) && sub.f && favoritesEnabled()) { return 'icon-star favorite-room pending-color'; }
		return 'icon-star-empty';
	},

	favoriteLabel() {
		const sub = ChatSubscription.findOne({ rid: this._id }, { fields: { f: 1 } });
		if (((sub != null ? sub.f : undefined) != null) && sub.f && favoritesEnabled()) { return 'Unfavorite'; }
		return 'Favorite';
	},

	subscribed() {
		return isSubscribed(this._id);
	},

	messagesHistory() {
		const hideMessagesOfType = [];
		RocketChat.settings.collection.find({_id: /Message_HideType_.+/}).forEach(function(record) {
			let types;
			const type = record._id.replace('Message_HideType_', '');
			switch (type) {
				case 'mute_unmute':
					types = [ 'user-muted', 'user-unmuted' ];
					break;
				default:
					types = [ type ];
			}
			return types.forEach(function(type) {
				const index = hideMessagesOfType.indexOf(type);

				if ((record.value === true) && (index === -1)) {
					return hideMessagesOfType.push(type);
				} else if (index > -1) {
					return hideMessagesOfType.splice(index, 1);
				}
			});
		});

		const query =
			{rid: this._id};

		if (hideMessagesOfType.length > 0) {
			query.t =
				{$nin: hideMessagesOfType};
		}

		const options = {
			sort: {
				ts: 1
			}
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
			const leader = RocketChat.models.Users.findOne({ _id: roles.u._id }, { fields: { status: 1 }}) || {};
			return {
				...roles.u,
				name: RocketChat.settings.get('UI_Use_Real_Name') ? (roles.u.name || roles.u.username) : roles.u.username,
				status: leader.status || 'offline',
				statusDisplay: (status => status.charAt(0).toUpperCase() + status.slice(1))(leader.status || 'offline')
			};
		}
	},

	chatNowLink() {
		return RocketChat.roomTypes.getRouteLink('d', { name: this.username });
	},

	roomName() {
		const roomData = Session.get(`roomData${ this._id }`);
		if (!roomData) { return ''; }

		return RocketChat.roomTypes.getRoomName(roomData.t, roomData);
	},

	secondaryName() {
		const roomData = Session.get(`roomData${ this._id }`);
		if (!roomData) { return ''; }

		return RocketChat.roomTypes.getSecondaryRoomName(roomData.t, roomData);
	},

	roomTopic() {
		const roomData = Session.get(`roomData${ this._id }`);
		if (!roomData) { return ''; }
		return roomData.topic;
	},

	showAnnouncement() {
		const roomData = Session.get(`roomData${ this._id }`);
		if (!roomData) { return false; }
		return (roomData.announcement !== undefined) && (roomData.announcement !== '');
	},

	roomAnnouncement() {
		const roomData = Session.get(`roomData${ this._id }`);
		if (!roomData) { return ''; }
		return roomData.announcement;
	},

	roomIcon() {
		const roomData = Session.get(`roomData${ this._id }`);
		if (!(roomData != null ? roomData.t : undefined)) { return ''; }

		return RocketChat.roomTypes.getIcon(roomData != null ? roomData.t : undefined);
	},

	userStatus() {
		const roomData = Session.get(`roomData${ this._id }`);
		return RocketChat.roomTypes.getUserStatus(roomData.t, this._id) || 'offline';
	},

	maxMessageLength() {
		return RocketChat.settings.get('Message_MaxAllowedSize');
	},

	unreadData() {
		const data =
			{count: RoomHistoryManager.getRoom(this._id).unreadNotLoaded.get() + Template.instance().unreadCount.get()};

		const room = RoomManager.getOpenedRoomByRid(this._id);
		if (room != null) {
			data.since = room.unreadSince != null ? room.unreadSince.get() : undefined;
		}

		return data;
	},

	containerBarsShow(unreadData, uploading) {
		if ((((unreadData != null ? unreadData.count : undefined) > 0) && (unreadData.since != null)) || ((uploading != null ? uploading.length : undefined) > 0)) { return 'show'; }
	},

	formatUnreadSince() {
		if ((this.since == null)) { return; }

		return moment(this.since).calendar(null, {sameDay: 'LT'});
	},

	flexData() {
		const flexData = {
			tabBar: Template.instance().tabBar,
			data: {
				rid: this._id,
				userDetail: Template.instance().userDetail.get(),
				clearUserDetail: Template.instance().clearUserDetail
			}
		};

		return flexData;
	},

	adminClass() {
		if (RocketChat.authz.hasRole(Meteor.userId(), 'admin')) { return 'admin'; }
	},

	showToggleFavorite() {
		if (isSubscribed(this._id) && favoritesEnabled()) { return true; }
	},

	viewMode() {
		const user = Meteor.user();
		const viewMode = user && user.settings && user.settings.preferences && user.settings.preferences.viewMode;
		const modes = ['', 'cozy', 'compact'];
		return modes[viewMode] || modes[0];
	},

	selectable() {
		return Template.instance().selectable.get();
	},

	hideUsername() {
		const user = Meteor.user();
		return user && user.settings && user.settings.preferences && user.settings.preferences.hideUsernames ? 'hide-usernames' : undefined;
	},

	hideAvatar() {
		const user = Meteor.user();
		return user && user.settings && user.settings.preferences && user.settings.preferences.hideAvatars ? 'hide-avatars' : undefined;
	},

	userCanDrop() {
		return userCanDrop(this._id);
	},

	canPreview() {
		const room = Session.get(`roomData${ this._id }`);
		if (room && room.t !== 'c') {
			return true;
		}

		if (RocketChat.settings.get('Accounts_AllowAnonymousRead') === true) {
			return true;
		}

		if (RocketChat.authz.hasAllPermission('preview-c-room')) {
			return true;
		}

		return (RocketChat.models.Subscriptions.findOne({rid: this._id}) != null);

	},
	toolbarButtons() {
		const toolbar = Session.get('toolbarButtons') || { buttons: {} };
		const buttons = Object.keys(toolbar.buttons).map(key => {
			return {
				id: key,
				...toolbar.buttons[key]
			};
		});
		return { buttons };
	},
	hideLeaderHeader() {
		return Template.instance().hideLeaderHeader.get() ? 'animated-hidden' : '';
	},
	hasLeader() {
		if (RoomRoles.findOne({ rid: this._id, roles: 'leader', 'u._id': { $ne: Meteor.userId() } }, { fields: { _id: 1 } })) {
			return 'has-leader';
		}
	}
});

let isSocialSharingOpen = false;
let touchMoved = false;
let lastTouchX = null;
let lastTouchY = null;
let lastScrollTop;

Template.room.events({
	'click .iframe-toolbar button'() {
		fireGlobalEvent('click-toolbar-button', { id: this.id });
	},

	'click, touchend'(e, t) {
		return Meteor.setTimeout(() => t.sendToBottomIfNecessaryDebounced(), 100);
	},

	'click .messages-container-main'() {
		const user = Meteor.user();

		if ((Template.instance().tabBar.getState() === 'opened') && user && user.settings && user.settings.preferences && user.settings.preferences.hideFlexTab) {
			return Template.instance().tabBar.close();
		}
	},

	'touchstart .message'(e, t) {
		const touches = e.originalEvent.touches;
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

		const message = this._arguments[1];
		const doLongTouch = () => {

			if ((window.plugins != null ? window.plugins.socialsharing : undefined) != null) {
				isSocialSharingOpen = true;

				if (e.target && (e.target.nodeName === 'A') && /^https?:\/\/.+/.test(e.target.getAttribute('href'))) {
					if (message.attachments != null) {
						const attachment = _.find(message.attachments, item => item.title === e.target.innerText);
						if (attachment != null) {
							socialSharing({
								file: e.target.href,
								subject: e.target.innerText,
								message: message.msg
							});
							return;
						}
					}

					socialSharing({
						link: e.target.href,
						subject: e.target.innerText,
						message: message.msg
					});
					return;
				}

				if (e.target && (e.target.nodeName === 'IMG')) {
					socialSharing({
						file: e.target.src,
						message: message.msg
					});
					return;
				}
			}

			return mobileMessageMenu.show(message, t, e, this);
		};

		Meteor.clearTimeout(t.touchtime);
		return t.touchtime = Meteor.setTimeout(doLongTouch, 500);
	},

	'click .message img'(e, t) {
		Meteor.clearTimeout(t.touchtime);
		if ((isSocialSharingOpen === true) || (touchMoved === true)) {
			e.preventDefault();
			return e.stopPropagation();
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

			if ((typeof cordova !== 'undefined' && cordova !== null ? cordova.InAppBrowser : undefined) != null) {
				return cordova.InAppBrowser.open(e.target.href, '_system');
			} else {
				return window.open(e.target.href);
			}
		}
	},

	'touchmove .message'(e, t) {
		const touches = e.originalEvent.touches;
		if (touches && touches.length) {
			const deltaX = Math.abs(lastTouchX - touches[0].pageX);
			const deltaY = Math.abs(lastTouchY - touches[0].pageY);
			if (deltaX > 5 || deltaY > 5) {
				touchMoved = true;
			}
		}
		return Meteor.clearTimeout(t.touchtime);
	},

	'touchcancel .message'(e, t) {
		return Meteor.clearTimeout(t.touchtime);
	},

	'click .upload-progress-text > button'(e) {
		e.preventDefault();
		return Session.set(`uploading-cancel-${ this.id }`, true);
	},

	'click .unread-bar > button.mark-read'() {
		return readMessage.readNow(true);
	},

	'click .unread-bar > button.jump-to'(e, t) {
		const { _id } = t.data;
		const room = RoomHistoryManager.getRoom(_id);
		let message = room && room.firstUnread.get();
		if (message) {
			return RoomHistoryManager.getSurroundingMessages(message, 50);
		} else {
			const subscription = ChatSubscription.findOne({ rid: _id });
			message = ChatMessage.find({ rid: _id, ts: { $gt: (subscription != null ? subscription.ls : undefined) } }, { sort: { ts: 1 }, limit: 1 }).fetch()[0];
			return RoomHistoryManager.getSurroundingMessages(message, 50);
		}
	},

	'click .toggle-favorite'(event) {
		event.stopPropagation();
		event.preventDefault();
		return Meteor.call('toggleFavorite', this._id, !$('i', event.currentTarget).hasClass('favorite-room'), function(err) {
			if (err) {
				return handleError(err);
			}
		});
	},

	'click .edit-room-title'(event) {
		event.preventDefault();
		Session.set('editRoomTitle', true);
		$('.fixed-title').addClass('visible');
		return Meteor.setTimeout(() => $('#room-title-field').focus().select(), 10);
	},

	'click .flex-tab .user-image > button'(e, instance) {
		if (!Meteor.userId()) {
			return;
		}

		openProfileTabOrOpenDM(e, instance, this.user.username);
	},

	'click .user-card-message'(e, instance) {
		if (!Meteor.userId() || !this._arguments) {
			return;
		}

		const username = this._arguments[1].u.username;

		openProfileTabOrOpenDM(e, instance, username);
	},

	'scroll .wrapper': _.throttle(function(e, t) {
		if (e.target.scrollTop < lastScrollTop) {
			t.hideLeaderHeader.set(false);
		} else if (e.target.scrollTop > $('.room-leader').height()) {
			t.hideLeaderHeader.set(true);
		}
		lastScrollTop = e.target.scrollTop;

		if (RoomHistoryManager.isLoading(this._id) === false && RoomHistoryManager.hasMore(this._id) === true || RoomHistoryManager.hasMoreNext(this._id) === true) {
			if (RoomHistoryManager.hasMore(this._id) === true && e.target.scrollTop === 0) {
				return RoomHistoryManager.getMore(this._id);
			} else if (RoomHistoryManager.hasMoreNext(this._id) === true && e.target.scrollTop >= e.target.scrollHeight - e.target.clientHeight) {
				return RoomHistoryManager.getMoreNext(this._id);
			}
		}
	}, 200),

	'click .new-message'() {
		Template.instance().atBottom = true;
		return Template.instance().find('.input-message').focus();
	},

	'click .message-cog'() {
		const [, message] = this._arguments;
		RocketChat.MessageAction.hideDropDown();

		let dropDown = $(`.messages-box \#${ message._id } .message-dropdown`);

		if (dropDown.length === 0) {
			const actions = RocketChat.MessageAction.getButtons(message, 'message');

			const el = Blaze.toHTMLWithData(Template.messageDropdown,
				{actions});

			$(`.messages-box \#${ message._id } .message-cog-container`).append(el);

			dropDown = $(`.messages-box \#${ message._id } .message-dropdown`);
		}

		return dropDown.show();
	},

	'click .message-dropdown .message-action'(e, t) {
		const el = $(e.currentTarget);

		const button = RocketChat.MessageAction.getButtonById(el.data('id'));
		if ((button != null ? button.action : undefined) != null) {
			return button.action.call(this, e, t);
		}
	},

	'click .message-dropdown-close'() {
		return RocketChat.MessageAction.hideDropDown();
	},

	'click .mention-link'(e, instance) {
		if (!Meteor.userId()) {
			return;
		}
		const channel = $(e.currentTarget).data('channel');
		if (channel != null) {
			if (RocketChat.Layout.isEmbedded()) {
				return fireGlobalEvent('click-mention-link', { path: FlowRouter.path('channel', {name: channel}), channel });
			}

			FlowRouter.go('channel', { name: channel }, FlowRouter.current().queryParams);
			return;
		}

		const username = $(e.currentTarget).data('username');

		openProfileTabOrOpenDM(e, instance, username);
	},

	'click .image-to-download'(event) {
		ChatMessage.update({_id: this._arguments[1]._id, 'urls.url': $(event.currentTarget).data('url')}, {$set: {'urls.$.downloadImages': true}});
		return ChatMessage.update({_id: this._arguments[1]._id, 'attachments.image_url': $(event.currentTarget).data('url')}, {$set: {'attachments.$.downloadImages': true}});
	},

	'click .collapse-switch'(e) {
		const index = $(e.currentTarget).data('index');
		const collapsed = $(e.currentTarget).data('collapsed');
		const id = this._arguments[1]._id;

		if ((this._arguments[1] != null ? this._arguments[1].attachments : undefined) != null) {
			ChatMessage.update({_id: id}, {$set: {[`attachments.${ index }.collapsed`]: !collapsed}});
		}

		if ((this._arguments[1] != null ? this._arguments[1].urls : undefined) != null) {
			return ChatMessage.update({_id: id}, {$set: {[`urls.${ index }.collapsed`]: !collapsed}});
		}
	},

	'dragenter .dropzone'(e) {
		const types = e.originalEvent && e.originalEvent.dataTransfer && e.originalEvent.dataTransfer.types;
		if (types != null && types.length > 0 && _.every(types, type => type.indexOf('text/') === -1 || type.indexOf('text/uri-list') !== -1) && userCanDrop(this._id)) {
			return e.currentTarget.classList.add('over');
		}
	},

	'dragleave .dropzone-overlay'(e) {
		return e.currentTarget.parentNode.classList.remove('over');
	},

	'dragover .dropzone-overlay'(e) {
		e = e.originalEvent || e;
		if (['move', 'linkMove'].includes(e.dataTransfer.effectAllowed)) {
			return e.dataTransfer.dropEffect = 'move';
		} else {
			return e.dataTransfer.dropEffect = 'copy';
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
				name: file.name
			});
		}

		return fileUpload(filesToUpload);
	},

	'load img'(e, template) {
		return (typeof template.sendToBottomIfNecessary === 'function' ? template.sendToBottomIfNecessary() : undefined);
	},

	'click .jump-recent button'(e, template) {
		e.preventDefault();
		template.atBottom = true;
		return RoomHistoryManager.clear(template && template.data && template.data._id);
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
			removeClass.forEach(message => $(`.messages-box #${ message }`).removeClass('selected'));
			addClass.forEach(message => $(`.messages-box #${ message }`).addClass('selected'));
		}
	}
});


Template.room.onCreated(function() {
	// this.scrollOnBottom = true
	// this.typing = new msgTyping this.data._id
	this.showUsersOffline = new ReactiveVar(false);
	this.atBottom = FlowRouter.getQueryParam('msg') ? false : true;
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

	this.resetSelection = enabled => {
		this.selectable.set(enabled);
		$('.messages-box .message.selected').removeClass('selected');
		this.selectedMessages = [];
		this.selectedRange = [];
		return this.selectablePointer = null;
	};

	this.selectMessages = to => {
		if ((this.selectablePointer === to) && (this.selectedRange.length > 0)) {
			return this.selectedRange = [];
		} else {
			const message1 = ChatMessage.findOne(this.selectablePointer);
			const message2 = ChatMessage.findOne(to);

			const minTs = _.min([message1.ts, message2.ts]);
			const maxTs = _.max([message1.ts, message2.ts]);

			return this.selectedRange = _.pluck(ChatMessage.find({ rid: message1.rid, ts: { $gte: minTs, $lte: maxTs } }).fetch(), '_id');
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

	this.setUserDetail = username => {
		return this.userDetail.set(username);
	};

	this.clearUserDetail = () => {
		return this.userDetail.set(null);
	};

	Meteor.call('getRoomRoles', this.data._id, function(error, results) {
		if (error) {
			return handleError(error);
		}

		return Array.from(results).map((record) => {
			delete record._id;
			RoomRoles.upsert({ rid: record.rid, 'u._id': record.u._id }, record);
		});
	});
	return RoomRoles.find({ rid: this.data._id }).observe({
		added: role => {
			if (!role.u||!role.u._id) {
				return;
			}
			return ChatMessage.update({ rid: this.data._id, 'u._id': role.u._id }, { $addToSet: { roles: role._id } }, { multi: true });
		}, // Update message to re-render DOM
		changed: (role) => {
			if (!role.u||!role.u._id) {
				return;
			}
			return ChatMessage.update({ rid: this.data._id, 'u._id': role.u._id }, { $inc: { rerender: 1 } }, { multi: true });
		}, // Update message to re-render DOM
		removed: role => {
			if (!role.u||!role.u._id) {
				return;
			}
			return ChatMessage.update({ rid: this.data._id, 'u._id': role.u._id }, { $pull: { roles: role._id } }, { multi: true });
		}});
}); // Update message to re-render DOM

Template.room.onDestroyed(function() {
	return window.removeEventListener('resize', this.onWindowResize);
});

Template.room.onRendered(function() {
	window.chatMessages = window.chatMessages || {};
	if (!window.chatMessages[Session.get('openedRoom')]) {
		window.chatMessages[Session.get('openedRoom')] = new ChatMessages;
	}
	window.chatMessages[Session.get('openedRoom')].init(this.firstNode);

	if (Meteor.Device.isDesktop()) {
		setTimeout(() => $('.message-form .input-message').focus(), 100);
	}

	// ScrollListener.init()

	const wrapper = this.find('.wrapper');
	const wrapperUl = this.find('.wrapper > ul');
	const newMessage = this.find('.new-message');

	const template = this;

	const messageBox = $('.messages-box');

	template.isAtBottom = function(scrollThreshold) {
		if ((scrollThreshold == null)) { scrollThreshold = 0; }
		if ((wrapper.scrollTop + scrollThreshold) >= (wrapper.scrollHeight - wrapper.clientHeight)) {
			newMessage.className = 'new-message background-primary-action-color color-content-background-color not';
			return true;
		}
		return false;
	};

	template.sendToBottom = function() {
		wrapper.scrollTop = wrapper.scrollHeight - wrapper.clientHeight;
		return newMessage.className = 'new-message background-primary-action-color color-content-background-color not';
	};

	template.checkIfScrollIsAtBottom = function() {
		template.atBottom = template.isAtBottom(100);
		readMessage.enable();
		return readMessage.read();
	};

	template.sendToBottomIfNecessary = function() {
		if ((template.atBottom === true) && (template.isAtBottom() !== true)) {
			return template.sendToBottom();
		}
	};

	template.sendToBottomIfNecessaryDebounced = _.debounce(template.sendToBottomIfNecessary, 10);

	template.sendToBottomIfNecessary();

	if ((window.MutationObserver == null)) {
		wrapperUl.addEventListener('DOMSubtreeModified', () => template.sendToBottomIfNecessaryDebounced());
	} else {
		const observer = new MutationObserver((mutations) => mutations.forEach(() => template.sendToBottomIfNecessaryDebounced()));

		observer.observe(wrapperUl, {childList: true});
	}
	// observer.disconnect()

	template.onWindowResize = () =>
		Meteor.defer(() => template.sendToBottomIfNecessaryDebounced())
	;

	window.addEventListener('resize', template.onWindowResize);

	wrapper.addEventListener('mousewheel', function() {
		template.atBottom = false;
		return Meteor.defer(() => template.checkIfScrollIsAtBottom());
	});

	wrapper.addEventListener('wheel', function() {
		template.atBottom = false;
		return Meteor.defer(() => template.checkIfScrollIsAtBottom());
	});

	wrapper.addEventListener('touchstart', () => template.atBottom = false);

	wrapper.addEventListener('touchend', function() {
		Meteor.defer(() => template.checkIfScrollIsAtBottom());
		Meteor.setTimeout(() => template.checkIfScrollIsAtBottom(), 1000);
		return Meteor.setTimeout(() => template.checkIfScrollIsAtBottom(), 2000);
	});

	wrapper.addEventListener('scroll', function() {
		template.atBottom = false;
		return Meteor.defer(() => template.checkIfScrollIsAtBottom());
	});

	$('.flex-tab-bar').on('click', (/*e, t*/) =>
		Meteor.setTimeout(() => template.sendToBottomIfNecessaryDebounced(), 50)
	);
	lastScrollTop = $('.messages-box .wrapper').scrollTop();

	const rtl = $('html').hasClass('rtl');

	const updateUnreadCount = _.throttle(function() {
		let lastInvisibleMessageOnScreen;
		const messageBoxOffset = messageBox.offset();

		if (rtl) {
			lastInvisibleMessageOnScreen = document.elementFromPoint((messageBoxOffset.left+messageBox.width())-1, messageBoxOffset.top+1);
		} else {
			lastInvisibleMessageOnScreen = document.elementFromPoint(messageBoxOffset.left+1, messageBoxOffset.top+1);
		}

		if ((lastInvisibleMessageOnScreen != null ? lastInvisibleMessageOnScreen.id : undefined) != null) {
			const lastMessage = ChatMessage.findOne(lastInvisibleMessageOnScreen.id);
			if (lastMessage != null) {
				const subscription = ChatSubscription.findOne({rid: template.data._id});
				const count = ChatMessage.find({rid: template.data._id, ts: {$lte: lastMessage.ts, $gt: (subscription != null ? subscription.ls : undefined)}}).count();
				return template.unreadCount.set(count);
			} else {
				return template.unreadCount.set(0);
			}
		}
	}, 300);

	readMessage.onRead(function(rid) {
		if (rid === template.data._id) {
			return template.unreadCount.set(0);
		}
	});

	wrapper.addEventListener('scroll', () => updateUnreadCount());
	/* globals WebRTC */
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
				return this.tabBar.open();
			}
		});
	}
});

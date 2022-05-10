import _ from 'underscore';
import moment from 'moment';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { ReactiveDict } from 'meteor/reactive-dict';
import { ReactiveVar } from 'meteor/reactive-var';
import { Random } from 'meteor/random';
import { Blaze } from 'meteor/blaze';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';

import { t, getUserPreference } from '../../../../utils/client';
import { WebRTC } from '../../../../webrtc/client';
import { ChatMessage, RoomRoles, Users, Subscriptions, Rooms } from '../../../../models';
import { RoomHistoryManager, RoomManager, readMessage } from '../../../../ui-utils/client';
import { messageContext } from '../../../../ui-utils/client/lib/messageContext';
import { messageArgs } from '../../../../ui-utils/client/lib/messageArgs';
import { settings } from '../../../../settings/client';
import { callbacks } from '../../../../../lib/callbacks';
import { hasAllPermission, hasRole } from '../../../../authorization/client';
import { ChatMessages } from '../../lib/chatMessages';
import { fileUpload } from '../../lib/fileUpload';
import './room.html';
import { getCommonRoomEvents } from './lib/getCommonRoomEvents';
import { RoomManager as NewRoomManager } from '../../../../../client/lib/RoomManager';
import { isLayoutEmbedded } from '../../../../../client/lib/utils/isLayoutEmbedded';
import { handleError } from '../../../../../client/lib/utils/handleError';
import { roomCoordinator } from '../../../../../client/lib/rooms/roomCoordinator';

export const chatMessages = {};

const userCanDrop = (_id) => !roomCoordinator.readOnly(_id, Users.findOne({ _id: Meteor.userId() }, { fields: { username: 1 } }));

const wipeFailedUploads = () => {
	const uploads = Session.get('uploading');

	if (uploads) {
		Session.set(
			'uploading',
			uploads.filter((upload) => !upload.error),
		);
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

	return settings.get('RetentionPolicy_DoNotPrunePinned');
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

async function createFileFromUrl(url) {
	let response;
	try {
		response = await fetch(url);
	} catch (error) {
		throw error;
	}

	const data = await response.blob();
	const metadata = {
		type: data.type,
	};
	const { mime } = await import('../../../../utils/lib/mimeTypes');
	const file = new File(
		[data],
		`File - ${moment().format(settings.get('Message_TimeAndDateFormat'))}.${mime.extension(data.type)}`,
		metadata,
	);
	return file;
}

function addToInput(text) {
	const { input } = chatMessages[RoomManager.openedRoom];
	const initText = input.value.slice(0, input.selectionStart);
	const finalText = input.value.slice(input.selectionEnd, input.value.length);

	input.value = initText + text + finalText;
	$(input).change().trigger('input');
}

callbacks.add('enter-room', wipeFailedUploads);

export const dropzoneHelpers = {
	dragAndDrop() {
		return settings.get('FileUpload_Enabled') && 'dropzone--disabled';
	},

	isDropzoneDisabled() {
		return settings.get('FileUpload_Enabled') ? 'dropzone-overlay--enabled' : 'dropzone-overlay--disabled';
	},

	dragAndDropLabel() {
		if (!userCanDrop(this._id)) {
			return 'error-not-allowed';
		}
		if (!settings.get('FileUpload_Enabled')) {
			return 'FileUpload_Disabled';
		}
		return 'Drop_to_upload_file';
	},
};

Template.roomOld.helpers({
	...dropzoneHelpers,
	tabBar() {
		return Template.instance().tabBar;
	},
	subscribed() {
		const { state } = Template.instance();
		return state.get('subscribed');
	},
	messagesHistory() {
		const showInMainThread = getUserPreference(Meteor.userId(), 'showMessageInMainThread', false);
		const { rid } = Template.instance();
		const room = Rooms.findOne(rid, { fields: { sysMes: 1 } });
		const hideSettings = settings.collection.findOne('Hide_System_Messages') || {};
		const settingValues = Array.isArray(room?.sysMes) ? room.sysMes : hideSettings.value || [];
		const hideMessagesOfType = new Set(
			settingValues.reduce((array, value) => [...array, ...(value === 'mute_unmute' ? ['user-muted', 'user-unmuted'] : [value])], []),
		);
		const query = {
			rid,
			_hidden: { $ne: true },
			...(!showInMainThread && {
				$or: [{ tmid: { $exists: 0 } }, { tshow: { $eq: true } }],
			}),
		};

		if (hideMessagesOfType.size) {
			query.t = { $nin: Array.from(hideMessagesOfType.values()) };
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
		return `chat-window-${this._id}`;
	},

	uploading() {
		return Session.get('uploading');
	},

	roomLeader() {
		const roles = RoomRoles.findOne({
			'rid': this._id,
			'roles': 'leader',
			'u._id': { $ne: Meteor.userId() },
		});
		if (roles) {
			const leader = Users.findOne({ _id: roles.u._id }, { fields: { status: 1, statusText: 1 } }) || {};

			return {
				...roles.u,
				name: settings.get('UI_Use_Real_Name') ? roles.u.name || roles.u.username : roles.u.username,
				status: leader.status || 'offline',
				statusDisplay: leader.statusText || t(leader.status || 'offline'),
			};
		}
	},

	chatNowLink() {
		return roomCoordinator.getRouteLink('d', { name: this.username });
	},

	announcement() {
		return Template.instance().state.get('announcement');
	},

	announcementDetails() {
		const roomData = Session.get(`roomData${this._id}`);
		if (!roomData) {
			return false;
		}
		if (roomData.announcementDetails != null && roomData.announcementDetails.callback != null) {
			return () => callbacks.run(roomData.announcementDetails.callback, this._id);
		}
	},

	messageboxData() {
		const { sendToBottomIfNecessary, subscription } = Template.instance();
		const { _id: rid } = this;
		const isEmbedded = isLayoutEmbedded();
		const showFormattingTips = settings.get('Message_ShowFormattingTips');

		return {
			rid,
			subscription: subscription.get(),
			isEmbedded,
			showFormattingTips: showFormattingTips && !isEmbedded,
			onInputChanged: (input) => {
				if (!chatMessages[rid]) {
					return;
				}

				chatMessages[rid].initializeInput(input, { rid });
			},
			onResize: () => sendToBottomIfNecessary && sendToBottomIfNecessary(),
			onKeyUp: (...args) => chatMessages[rid] && chatMessages[rid].keyup.apply(chatMessages[rid], args),
			onKeyDown: (...args) => chatMessages[rid] && chatMessages[rid].keydown.apply(chatMessages[rid], args),
			onSend: (...args) => chatMessages[rid] && chatMessages[rid].send.apply(chatMessages[rid], args),
		};
	},

	getAnnouncementStyle() {
		const { room } = Template.instance();
		if (!room) {
			return '';
		}
		return room.announcementDetails && room.announcementDetails.style !== undefined ? room.announcementDetails.style : '';
	},

	maxMessageLength() {
		return settings.get('Message_MaxAllowedSize');
	},

	unreadData() {
		const data = { count: Template.instance().state.get('count') };

		const room = RoomManager.getOpenedRoomByRid(this._id);
		if (room) {
			data.since = room.unreadSince.get();
		}

		return data;
	},

	containerBarsShow(unreadData, uploading) {
		const hasUnreadData = unreadData && unreadData.count && unreadData.since;
		const isUploading = uploading && uploading.length;

		if (hasUnreadData || isUploading) {
			return 'show';
		}
	},

	formatUnreadSince() {
		if (!this.since) {
			return;
		}

		return moment(this.since).calendar(null, { sameDay: 'LT' });
	},
	adminClass() {
		if (hasRole(Meteor.userId(), 'admin')) {
			return 'admin';
		}
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
		return getUserPreference(Meteor.userId(), 'displayAvatars') ? undefined : 'hide-avatars';
	},
	canPreview() {
		const { room, state } = Template.instance();

		if (room && room.t !== 'c') {
			return true;
		}

		if (settings.get('Accounts_AllowAnonymousRead') === true) {
			return true;
		}

		if (hasAllPermission('preview-c-room')) {
			return true;
		}

		return state.get('subscribed');
	},
	hideLeaderHeader() {
		return Template.instance().hideLeaderHeader.get() ? 'animated-hidden' : '';
	},
	hasLeader() {
		if (RoomRoles.findOne({ 'rid': this._id, 'roles': 'leader', 'u._id': { $ne: Meteor.userId() } }, { fields: { _id: 1 } })) {
			return 'has-leader';
		}
	},
	hasPurge() {
		const { room } = Template.instance();
		return roomHasPurge(room);
	},
	filesOnly() {
		const { room } = Template.instance();
		return roomFilesOnly(room);
	},
	excludePinned() {
		const { room } = Template.instance();
		return roomExcludePinned(room);
	},
	purgeTimeout() {
		const { room } = Template.instance();
		moment.relativeTimeThreshold('s', 60);
		moment.relativeTimeThreshold('ss', 0);
		moment.relativeTimeThreshold('m', 60);
		moment.relativeTimeThreshold('h', 24);
		moment.relativeTimeThreshold('d', 31);
		moment.relativeTimeThreshold('M', 12);

		return moment.duration(roomMaxAge(room) * 1000 * 60 * 60 * 24).humanize();
	},
	messageContext,
	openedThread() {
		FlowRouter.watchPathChange();
		const tab = FlowRouter.getParam('tab');
		const mid = FlowRouter.getParam('context');
		const rid = Template.currentData()._id;
		const jump = FlowRouter.getQueryParam('jump');
		const subscription = Template.instance().subscription.get();

		if (tab !== 'thread' || !mid || rid !== Session.get('openedRoom')) {
			return;
		}

		const room = Rooms.findOne(
			{ _id: rid },
			{
				fields: {
					t: 1,
					usernames: 1,
					uids: 1,
					name: 1,
				},
			},
		);

		return {
			rid,
			mid,
			room,
			jump,
			subscription,
		};
	},
});

export const dropzoneEvents = {
	'dragenter .dropzone'(e) {
		const types = e.originalEvent && e.originalEvent.dataTransfer && e.originalEvent.dataTransfer.types;

		if (
			types != null &&
			types.length > 0 &&
			_.some(types, (type) => type.indexOf('text/') === -1 || type.indexOf('text/uri-list') !== -1 || type.indexOf('text/plain') !== -1) &&
			userCanDrop(this._id)
		) {
			e.currentTarget.classList.add('over');
		}
		e.stopPropagation();
	},

	'dragleave .dropzone-overlay'(e) {
		e.currentTarget.parentNode.classList.remove('over');
		e.stopPropagation();
	},

	'dragover .dropzone-overlay'(e) {
		document.querySelectorAll('.over.dropzone').forEach((dropzone) => {
			if (dropzone !== e.currentTarget.parentNode) {
				dropzone.classList.remove('over');
			}
		});
		e = e.originalEvent || e;
		if (['move', 'linkMove'].includes(e.dataTransfer.effectAllowed)) {
			e.dataTransfer.dropEffect = 'move';
		} else {
			e.dataTransfer.dropEffect = 'copy';
		}
		e.stopPropagation();
	},

	async 'dropped .dropzone-overlay'(event, instance) {
		event.currentTarget.parentNode.classList.remove('over');

		const e = event.originalEvent || event;

		e.stopPropagation();
		e.preventDefault();

		if (!userCanDrop(this._id) || !settings.get('FileUpload_Enabled')) {
			return false;
		}

		let files = (e.dataTransfer && e.dataTransfer.files) || [];

		if (files.length < 1) {
			const transferData = e.dataTransfer.getData('text') || e.dataTransfer.getData('url');

			if (e.dataTransfer.types.includes('text/uri-list')) {
				const url = e.dataTransfer.getData('text/html').match('<img.+src=(?:"|\')(.+?)(?:"|\')(?:.+?)>');
				const imgURL = url && url[1];

				if (!imgURL) {
					return;
				}

				const file = await createFileFromUrl(imgURL);
				if (typeof file === 'string') {
					return addToInput(file);
				}
				files = [file];
			}
			if (e.dataTransfer.types.includes('text/plain') && !e.dataTransfer.types.includes('text/x-moz-url')) {
				return addToInput(transferData.trim());
			}
		}
		const { mime } = await import('../../../../utils/lib/mimeTypes');
		const filesToUpload = Array.from(files).map((file) => {
			Object.defineProperty(file, 'type', { value: mime.lookup(file.name) });
			return {
				file,
				name: file.name,
			};
		});

		return instance.onFile && instance.onFile(filesToUpload);
	},
};
Meteor.startup(() => {
	Template.roomOld.events({
		...getCommonRoomEvents(),
		...dropzoneEvents,
		'click .toggle-hidden'(e) {
			const id = e.currentTarget.dataset.message;
			document.querySelector(`#${id}`).classList.toggle('message--ignored');
		},

		'click .message'(e, template) {
			if (template.selectable.get()) {
				(document.selection != null ? document.selection.empty() : undefined) ||
					(typeof window.getSelection === 'function' ? window.getSelection().removeAllRanges() : undefined);
				const data = Blaze.getData(e.currentTarget);
				const {
					msg: { _id },
				} = messageArgs(data);

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
				removeClass.forEach((message) => $(`.messages-box #${message}`).removeClass('selected'));
				addClass.forEach((message) => $(`.messages-box #${message}`).addClass('selected'));
			}
		},
		'click .jump-recent button'(e, template) {
			e.preventDefault();
			template.atBottom = true;
			RoomHistoryManager.clear(template && template.data && template.data._id);
			RoomHistoryManager.getMoreIfIsEmpty(this._id);
		},
		'load .gallery-item'(e, template) {
			template.sendToBottomIfNecessary();
		},

		'rendered .js-block-wrapper'(e, template) {
			template.sendToBottomIfNecessary();
		},
		'click .new-message'(event, instance) {
			instance.atBottom = true;
			instance.sendToBottomIfNecessary();
			chatMessages[RoomManager.openedRoom].input.focus();
		},
		'click .upload-progress-close'(e) {
			e.preventDefault();
			Session.set(`uploading-cancel-${this.id}`, true);
		},
		'click .unread-bar > button.mark-read'(e, t) {
			readMessage.readNow(t.data._id);
		},

		'click .unread-bar > button.jump-to'(e, t) {
			const { _id } = t.data;
			const room = RoomHistoryManager.getRoom(_id);
			let message = room && room.firstUnread.get();
			if (!message) {
				const subscription = Subscriptions.findOne({ rid: _id });
				message = ChatMessage.find(
					{ rid: _id, ts: { $gt: subscription != null ? subscription.ls : undefined } },
					{ sort: { ts: 1 }, limit: 1 },
				).fetch()[0];
			}
			RoomHistoryManager.getSurroundingMessages(message, 50);
		},
		'scroll .wrapper': _.throttle(function (e, t) {
			const $roomLeader = $('.room-leader');
			if ($roomLeader.length) {
				if (e.target.scrollTop < t.lastScrollTop) {
					t.hideLeaderHeader.set(false);
				} else if (t.isAtBottom(100) === false && e.target.scrollTop > $roomLeader.height()) {
					t.hideLeaderHeader.set(true);
				}
			}
			t.lastScrollTop = e.target.scrollTop;
			const height = e.target.clientHeight;
			const isLoading = RoomHistoryManager.isLoading(this._id);
			const hasMore = RoomHistoryManager.hasMore(this._id);
			const hasMoreNext = RoomHistoryManager.hasMoreNext(this._id);

			if ((isLoading === false && hasMore === true) || hasMoreNext === true) {
				if (hasMore === true && t.lastScrollTop <= height / 3) {
					RoomHistoryManager.getMore(this._id);
				} else if (hasMoreNext === true && Math.ceil(t.lastScrollTop) >= e.target.scrollHeight - height) {
					RoomHistoryManager.getMoreNext(this._id);
				}
			}
		}, 100),

		'click .time a'(e) {
			e.preventDefault();
			const { msg } = messageArgs(this);
			const repliedMessageId = msg.attachments[0].message_link.split('?msg=')[1];
			FlowRouter.go(FlowRouter.current().context.pathname, null, {
				msg: repliedMessageId,
				hash: Random.id(),
			});
		},
	});

	Template.roomOld.onCreated(function () {
		// this.scrollOnBottom = true
		// this.typing = new msgTyping this.data._id
		const rid = this.data._id;
		this.tabBar = this.data.tabBar;

		this.onFile = (filesToUpload) => {
			fileUpload(filesToUpload, chatMessages[rid].input, { rid });
		};

		this.rid = rid;

		this.subscription = new ReactiveVar();
		this.state = new ReactiveDict();
		this.userDetail = new ReactiveVar('');
		const user = Meteor.user();
		this.autorun((c) => {
			const room = Rooms.findOne(
				{ _id: rid },
				{
					fields: {
						t: 1,
						usernames: 1,
						uids: 1,
					},
				},
			);

			if (room.t !== 'd') {
				return c.stop();
			}

			if (roomCoordinator.getRoomDirectives(room.t)?.isGroupChat(room)) {
				return;
			}
			const usernames = Array.from(new Set(room.usernames));
			this.userDetail.set(
				this.userDetail.get() || (usernames.length === 1 ? usernames[0] : usernames.filter((username) => username !== user.username)[0]),
			);
		});

		this.autorun(() => {
			const rid = Template.currentData()._id;
			const room = Rooms.findOne({ _id: rid }, { fields: { announcement: 1 } });
			this.state.set('announcement', room.announcement);
		});

		this.autorun(() => {
			const subscription = Subscriptions.findOne({ rid });
			this.subscription.set(subscription);
			this.state.set({
				subscribed: !!subscription,
				autoTranslate: subscription && subscription.autoTranslate,
				autoTranslateLanguage: subscription && subscription.autoTranslateLanguage,
			});
		});

		this.showUsersOffline = new ReactiveVar(false);
		this.atBottom = !FlowRouter.getQueryParam('msg');
		this.unreadCount = new ReactiveVar(0);

		this.selectable = new ReactiveVar(false);
		this.selectedMessages = [];
		this.selectedRange = [];
		this.selectablePointer = null;

		this.flexTemplate = new ReactiveVar();

		this.groupDetail = new ReactiveVar();

		this.hideLeaderHeader = new ReactiveVar(false);

		this.resetSelection = (enabled) => {
			this.selectable.set(enabled);
			$('.messages-box .message.selected').removeClass('selected');
			this.selectedMessages = [];
			this.selectedRange = [];
			this.selectablePointer = null;
		};

		this.selectMessages = (to) => {
			if (this.selectablePointer === to && this.selectedRange.length > 0) {
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

		this.clearUserDetail = () => {
			this.userDetail.set(null);
			this.tabBar.setData({});
			this.tabBar.close();
		};

		Meteor.call('getRoomRoles', this.data._id, function (error, results) {
			if (error) {
				handleError(error);
			}

			return Array.from(results).forEach((record) => {
				delete record._id;
				RoomRoles.upsert({ 'rid': record.rid, 'u._id': record.u._id }, record);
			});
		});

		this.rolesObserve = RoomRoles.find({ rid: this.data._id }).observe({
			added: (role) => {
				if (!role.u || !role.u._id) {
					return;
				}
				ChatMessage.update({ 'rid': this.data._id, 'u._id': role.u._id }, { $addToSet: { roles: role._id } }, { multi: true });
			}, // Update message to re-render DOM
			changed: (role) => {
				if (!role.u || !role.u._id) {
					return;
				}
				ChatMessage.update({ 'rid': this.data._id, 'u._id': role.u._id }, { $inc: { rerender: 1 } }, { multi: true });
			}, // Update message to re-render DOM
			removed: (role) => {
				if (!role.u || !role.u._id) {
					return;
				}
				ChatMessage.update({ 'rid': this.data._id, 'u._id': role.u._id }, { $pull: { roles: role._id } }, { multi: true });
			},
		});

		this.sendToBottomIfNecessary = () => {
			if (this.atBottom === true) {
				this.sendToBottom();
			}
		};
	}); // Update message to re-render DOM

	Template.roomOld.onDestroyed(function () {
		if (this.rolesObserve) {
			this.rolesObserve.stop();
		}

		readMessage.off(this.data._id);

		window.removeEventListener('resize', this.onWindowResize);

		this.observer && this.observer.disconnect();

		const chatMessage = chatMessages[this.data._id];
		chatMessage.onDestroyed && chatMessage.onDestroyed(this.data._id);

		callbacks.remove('streamNewMessage', this.data._id);
	});

	const isAtBottom = function (element, scrollThreshold = 0) {
		return element.scrollTop + scrollThreshold >= element.scrollHeight - element.clientHeight;
	};

	Template.roomOld.onRendered(function () {
		const { _id: rid } = this.data;

		if (!chatMessages[rid]) {
			chatMessages[rid] = new ChatMessages();
		}

		const wrapper = this.find('.wrapper');

		const store = NewRoomManager.getStore(rid);

		const afterMessageGroup = () => {
			if (store.scroll && !store.atBottom) {
				wrapper.scrollTop = store.scroll;
			} else {
				this.sendToBottom();
			}
			wrapper.removeEventListener('MessageGroup', afterMessageGroup);

			wrapper.addEventListener(
				'scroll',
				_.throttle(() => {
					store.update({ scroll: wrapper.scrollTop, atBottom: isAtBottom(wrapper, 50) });
				}, 30),
			);
		};

		wrapper.addEventListener('MessageGroup', afterMessageGroup);

		chatMessages[rid].initializeWrapper(this.find('.wrapper'));
		chatMessages[rid].initializeInput(this.find('.js-input-message'), { rid });

		const wrapperUl = this.find('.wrapper > ul');
		const newMessage = this.find('.new-message');

		const template = this;

		const messageBox = $('.messages-box');

		template.isAtBottom = function (scrollThreshold = 0) {
			if (isAtBottom(wrapper, scrollThreshold)) {
				newMessage.className = 'new-message background-primary-action-color color-content-background-color not';
				return true;
			}
			return false;
		};

		template.sendToBottom = function () {
			wrapper.scrollTo(30, wrapper.scrollHeight);
			newMessage.className = 'new-message background-primary-action-color color-content-background-color not';
		};

		template.checkIfScrollIsAtBottom = function () {
			template.atBottom = template.isAtBottom(100);
		};

		template.observer = new ResizeObserver(() => template.sendToBottomIfNecessary());

		template.observer.observe(wrapperUl);

		const wheelHandler = _.throttle(function () {
			template.checkIfScrollIsAtBottom();
		}, 100);

		wrapper.addEventListener('mousewheel', wheelHandler);

		wrapper.addEventListener('wheel', wheelHandler);

		wrapper.addEventListener('touchstart', () => {
			template.atBottom = false;
		});

		wrapper.addEventListener('touchend', function () {
			template.checkIfScrollIsAtBottom();
			setTimeout(() => template.checkIfScrollIsAtBottom(), 1000);
			setTimeout(() => template.checkIfScrollIsAtBottom(), 2000);
		});

		Tracker.afterFlush(() => {
			wrapper.addEventListener('scroll', wheelHandler);
		});

		this.lastScrollTop = $('.messages-box .wrapper').scrollTop();

		const rtl = $('html').hasClass('rtl');

		const getElementFromPoint = function (topOffset = 0) {
			const messageBoxOffset = messageBox.offset();

			let element;
			if (rtl) {
				element = document.elementFromPoint(messageBoxOffset.left + messageBox.width() - 1, messageBoxOffset.top + topOffset + 1);
			} else {
				element = document.elementFromPoint(messageBoxOffset.left + 1, messageBoxOffset.top + topOffset + 1);
			}

			if (element && element.classList.contains('message')) {
				return element;
			}
		};

		const updateUnreadCount = _.throttle(() => {
			Tracker.afterFlush(() => {
				const lastInvisibleMessageOnScreen = getElementFromPoint(0) || getElementFromPoint(20) || getElementFromPoint(40);

				if (!lastInvisibleMessageOnScreen || !lastInvisibleMessageOnScreen.id) {
					return this.unreadCount.set(0);
				}

				const lastMessage = ChatMessage.findOne(lastInvisibleMessageOnScreen.id);
				if (!lastMessage) {
					return this.unreadCount.set(0);
				}

				this.state.set('lastMessage', lastMessage.ts);
			});
		}, 300);

		const read = _.debounce(function () {
			if (rid !== Session.get('openedRoom')) {
				return;
			}
			readMessage.read(rid);
		}, 500);

		this.autorun(() => {
			Tracker.afterFlush(() => {
				if (rid !== Session.get('openedRoom')) {
					return;
				}

				let room = Rooms.findOne({ _id: rid }, { fields: { t: 1 } });

				if (room?.t === 'l') {
					room = Tracker.nonreactive(() => Rooms.findOne({ _id: rid }));
					roomCoordinator.getRoomDirectives(room.t)?.openCustomProfileTab(this, room, room.v.username);
				}
			});
		});

		this.autorun(() => {
			if (!roomCoordinator.isRouteNameKnown(FlowRouter.getRouteName())) {
				return;
			}

			if (rid !== Session.get('openedRoom')) {
				return;
			}

			const subscription = Subscriptions.findOne({ rid }, { fields: { alert: 1, unread: 1 } });
			read();
			return subscription && (subscription.alert || subscription.unread) && readMessage.refreshUnreadMark(rid);
		});

		this.autorun(() => {
			const lastMessage = this.state.get('lastMessage');

			const subscription = Subscriptions.findOne({ rid }, { fields: { ls: 1 } });
			if (!subscription) {
				this.unreadCount.set(0);
				return;
			}

			const count = ChatMessage.find({
				rid,
				ts: { $lte: lastMessage, $gt: subscription && subscription.ls },
			}).count();

			this.unreadCount.set(count);
		});

		this.autorun(() => {
			const count = RoomHistoryManager.getRoom(rid).unreadNotLoaded.get() + this.unreadCount.get();
			this.state.set('count', count);
		});

		this.autorun(() => {
			Rooms.findOne(rid);
			const count = this.state.get('count');
			if (count === 0) {
				return read();
			}
			readMessage.refreshUnreadMark(rid);
		});

		readMessage.on(template.data._id, () => this.unreadCount.set(0));

		wrapper.addEventListener('scroll', updateUnreadCount);
		// salva a data da renderização para exibir alertas de novas mensagens
		$.data(this.firstNode, 'renderedAt', new Date());

		const webrtc = WebRTC.getInstanceByRoomId(template.data._id);
		if (webrtc) {
			this.autorun(() => {
				const remoteItems = webrtc.remoteItems.get();
				if ((remoteItems && remoteItems.length > 0) || webrtc.localUrl.get()) {
					return this.tabBar.openUserInfo();
				}
			});
		}

		callbacks.add(
			'streamNewMessage',
			(msg) => {
				if (rid !== msg.rid || msg.editedAt || msg.tmid) {
					return;
				}

				if (msg.u._id === Meteor.userId()) {
					return template.sendToBottom();
				}

				if (!template.isAtBottom()) {
					newMessage.classList.remove('not');
				}
			},
			callbacks.priority.MEDIUM,
			rid,
		);

		this.autorun(function () {
			if (template.data._id !== RoomManager.openedRoom) {
				return;
			}

			const room = Rooms.findOne({ _id: template.data._id });
			if (!room) {
				return FlowRouter.go('home');
			}
		});
	});
});

callbacks.add('enter-room', (sub) => {
	if (!sub) {
		return;
	}
	const isAReplyInDMFromChannel = FlowRouter.getQueryParam('reply') && sub.t === 'd';
	if (isAReplyInDMFromChannel && chatMessages[sub.rid]) {
		chatMessages[sub.rid].restoreReplies();
	}
	setTimeout(() => readMessage.read(sub.rid), 1000);
});

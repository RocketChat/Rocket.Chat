import { Meteor } from 'meteor/meteor';
import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/tap:i18n';
import _ from 'underscore';
// import moment from 'moment';
import { DateFormat } from 'meteor/rocketchat:lib';
import { renderEmoji } from 'meteor/rocketchat:emoji';
import { renderMessageBody } from 'meteor/rocketchat:ui-utils';
import { RocketChat } from 'meteor/rocketchat:lib';
// import { RoomRoles, UserRoles } from 'meteor/rocketchat:ui';
import { t } from 'meteor/rocketchat:utils';

import mem from './memoize';

async function renderPdfToCanvas(canvasId, pdfLink) {
	const isSafari = /constructor/i.test(window.HTMLElement) ||
		((p) => p.toString() === '[object SafariRemoteNotification]')(!window.safari ||
			(typeof window.safari !== 'undefined' && window.safari.pushNotification));

	if (isSafari) {
		const [, version] = /Version\/([0-9]+)/.exec(navigator.userAgent) || [null, 0];
		if (version <= 12) {
			return;
		}
	}

	if (!pdfLink || !/\.pdf$/i.test(pdfLink)) {
		return;
	}

	const canvas = document.getElementById(canvasId);
	if (!canvas) {
		return;
	}

	const pdfjsLib = await import('pdfjs-dist');
	pdfjsLib.GlobalWorkerOptions.workerSrc = `${ Meteor.absoluteUrl() }node_modules/pdfjs-dist/build/pdf.worker.js`;

	const loader = document.getElementById(`js-loading-${ canvasId }`);

	if (loader) {
		loader.style.display = 'block';
	}

	const pdf = await pdfjsLib.getDocument(pdfLink);
	const page = await pdf.getPage(1);
	const scale = 0.5;
	const viewport = page.getViewport(scale);
	const context = canvas.getContext('2d');
	canvas.height = viewport.height;
	canvas.width = viewport.width;
	await page.render({
		canvasContext: context,
		viewport,
	}).promise;

	if (loader) {
		loader.style.display = 'none';
	}

	canvas.style.maxWidth = '-webkit-fill-available';
	canvas.style.maxWidth = '-moz-available';
	canvas.style.display = 'block';
}

const hideHoles = mem(() => !RocketChat.settings.get('UI_DisplayRoles') || RocketChat.getUserPreference(Meteor.userId(), 'hideRoles'));
// const getUserRoles = mem((rid, uid) => {
// 	const userRoles = UserRoles.findOne(uid);
// 	const roomRoles = RoomRoles.findOne({
// 		'u._id': uid,
// 		rid,
// 	});
// 	return [...(userRoles && userRoles.roles) || [], ...(roomRoles && roomRoles.roles) || []];
// });
const getRoles = mem((roles) => RocketChat.models.Roles.find({
	_id: {
		$in: roles,
	},
	description: {
		$exists: 1,
		$ne: '',
	},
}, {
	fields: {
		description: 1,
	},
}));
Template.message.helpers({
	encodeURI(text) {
		return encodeURI(text);
	},
	broadcast() {
		const { room } = Template.instance();
		return !this.private && !this.t && this.u._id !== Meteor.userId() && room && room.broadcast;
	},
	isIgnored() {
		return this.ignored;
	},
	ignoredClass() {
		return this.ignored ? 'message--ignored' : '';
	},
	isDecrypting() {
		return this.e2e === 'pending';
	},
	isBot() {
		if (this.bot != null) {
			return 'bot';
		}
	},
	roleTags() {
		if (!this.u || !this.u._id) {
			return [];
		}

		if (hideHoles()) {
			return [];
		}

		// const roles = getUserRoles(this.rid, this.u._id);

		return getRoles(this.roles);
	},
	isGroupable() {
		if (this.groupable === false || Template.instance().room.broadcast) {
			return 'false';
		}
	},
	isSequential() {
		return this.groupable !== false && !Template.instance().room.broadcast;
	},
	sequentialClass() {
		if (this.groupable !== false) {
			return 'sequential';
		}
	},
	avatarFromUsername() {
		if ((this.avatar != null) && this.avatar[0] === '@') {
			return this.avatar.replace(/^@/, '');
		}
	},
	getEmoji(emoji) {
		return renderEmoji(emoji);
	},
	getName() {
		if (this.alias) {
			return this.alias;
		}
		if (!this.u) {
			return '';
		}
		return (Template.instance().useRealName && this.u.name) || this.u.username;
	},
	showUsername() {
		return this.alias || (RocketChat.settings.get('UI_Use_Real_Name') && this.u && this.u.name);
	},
	own() {
		if (this.u && this.u._id === Meteor.userId()) {
			return 'own';
		}
	},
	timestamp() {
		return +this.ts;
	},
	chatops() {
		if (this.u && this.u.username === RocketChat.settings.get('Chatops_Username')) {
			return 'chatops-message';
		}
	},
	time() {
		return DateFormat.formatTime(this.ts);
	},
	date() {
		return DateFormat.formatDate(this.ts);
	},
	isTemp() {
		if (this.temp === true) {
			return 'temp';
		}
	},
	body() {
		return Template.instance().body;
	},
	system(returnClass) {
		if (RocketChat.MessageTypes.isSystemMessage(this)) {
			if (returnClass) {
				return 'color-info-font-color';
			}
			return 'system';
		}
	},
	showTranslated() {
		if (this.u && this.u._id !== Meteor.userId() && RocketChat.settings.get('AutoTranslate_Enabled') && !RocketChat.MessageTypes.isSystemMessage(this)) {
			const { subscription } = Template.instance();
			const language = RocketChat.AutoTranslate.getLanguage(this.rid);
			return this.autoTranslateFetching || (subscription && subscription.autoTranslate !== this.autoTranslateShowInverse && this.translations && this.translations[language]);
		}
	},
	edited() {
		return Template.instance().wasEdited;
	},
	editTime() {
		if (Template.instance().wasEdited) {
			return DateFormat.formatDateAndTime(this.editedAt);
		}
	},
	editedBy() {
		if (!Template.instance().wasEdited) {
			return '';
		}
		// try to return the username of the editor,
		// otherwise a special "?" character that will be
		// rendered as a special avatar
		return (this.editedBy && this.editedBy.username) || '?';
	},
	// canEdit() {
	// 	const hasPermission = RocketChat.authz.hasAtLeastOnePermission('edit-message', this.rid);
	// 	const isEditAllowed = RocketChat.settings.get('Message_AllowEditing');
	// 	const editOwn = this.u && this.u._id === Meteor.userId();
	// 	if (!(hasPermission || (isEditAllowed && editOwn))) {
	// 		return;
	// 	}
	// 	const { blockEditInMinutes } = Template.instance();
	// 	if (blockEditInMinutes) {
	// 		let msgTs;
	// 		if (this.ts != null) {
	// 			msgTs = moment(this.ts);
	// 		}
	// 		let currentTsDiff;
	// 		if (msgTs != null) {
	// 			currentTsDiff = moment().diff(msgTs, 'minutes');
	// 		}
	// 		return currentTsDiff < blockEditInMinutes;
	// 	}
	// 	return true;
	// },
	// canDelete() {
	// 	const { hasPermission, isDeleteAllowed } = Template.instance();
	// 	const deleteOwn = this.u && this.u._id === Meteor.userId();
	// 	if (!(hasPermission || (isDeleteAllowed && deleteOwn))) {
	// 		return;
	// 	}
	// 	const { blockDeleteInMinutes } = Template.instance();
	// 	if (blockDeleteInMinutes) {
	// 		let msgTs;
	// 		if (this.ts != null) {
	// 			msgTs = moment(this.ts);
	// 		}
	// 		let currentTsDiff;
	// 		if (msgTs != null) {
	// 			currentTsDiff = moment().diff(msgTs, 'minutes');
	// 		}
	// 		return currentTsDiff < blockDeleteInMinutes;
	// 	}
	// 	return true;
	// },
	showEditedStatus() {
		return RocketChat.settings.get('Message_ShowEditedStatus');
	},
	label() {
		if (this.i18nLabel) {
			return t(this.i18nLabel);
		}
		return this.label;
	},
	hasOembed() {
		// there is no URLs, there is no template to show the oembed (oembed package removed) or oembed is not enable
		if (!(this.urls && this.urls.length > 0) || !Template.oembedBaseWidget || !RocketChat.settings.get('API_Embed')) {
			return false;
		}

		// check if oembed is disabled for message's sender
		if ((RocketChat.settings.get('API_EmbedDisabledFor') || '').split(',').map((username) => username.trim()).includes(this.u && this.u.username)) {
			return false;
		}
		return true;
	},
	reactions() {
		const userUsername = Template.instance().username;
		return Object.keys(this.reactions || {}).map((emoji) => {
			const reaction = this.reactions[emoji];
			const total = reaction.usernames.length;
			let usernames = reaction.usernames
				.slice(0, 15)
				.map((username) => (username === userUsername ? t('You').toLowerCase() : `@${ username }`))
				.join(', ');
			if (total > 15) {
				usernames = `${ usernames } ${ t('And_more', {
					length: total - 15,
				}).toLowerCase() }`;
			} else {
				usernames = usernames.replace(/,([^,]+)$/, ` ${ t('and') }$1`);
			}
			if (usernames[0] !== '@') {
				usernames = usernames[0].toUpperCase() + usernames.substr(1);
			}
			return {
				emoji,
				count: reaction.usernames.length,
				usernames,
				reaction: ` ${ t('Reacted_with').toLowerCase() } ${ emoji }`,
				userReacted: reaction.usernames.indexOf(userUsername) > -1,
			};
		});
	},
	markUserReaction(reaction) {
		if (reaction.userReacted) {
			return {
				class: 'selected',
			};
		}
	},
	hideReactions() {
		if (_.isEmpty(this.reactions)) {
			return 'hidden';
		}
	},
	actionLinks() {
		// remove 'method_id' and 'params' properties
		return _.map(this.actionLinks, function(actionLink, key) {
			return _.extend({
				id: key,
			}, _.omit(actionLink, 'method_id', 'params'));
		});
	},
	hideActionLinks() {
		if (_.isEmpty(this.actionLinks)) {
			return 'hidden';
		}
	},
	injectIndex(data, index) {
		data.index = index;
	},
	hideCog() {
		const { subscription } = Template.instance();
		if (subscription == null) {
			return 'hidden';
		}
	},
	channelName() {
		const { subscription } = Template.instance();
		return subscription && subscription.name;
	},
	roomIcon() {
		const { room } = Template.instance();
		if (room && room.t === 'd') {
			return 'at';
		}
		return RocketChat.roomTypes.getIcon(room && room.t);
	},
	fromSearch() {
		return this.customClass === 'search';
	},
	actionContext() {
		return this.actionContext;
	},
	messageActions(group) {
		let messageGroup = group;
		let context = this.actionContext;

		if (!group) {
			messageGroup = 'message';
		}

		if (!context) {
			context = 'message';
		}

		return RocketChat.MessageAction.getButtons(Template.currentData(), context, messageGroup);
	},
	isSnippet() {
		return this.actionContext === 'snippeted';
	},
});



const findRoom = mem((rid) => RocketChat.models.Rooms.findOne({
	_id: rid,
}, {
	fields: {
		broadcast: 1,
	},
}));

const findSubscription = mem((rid) => RocketChat.models.Subscriptions.findOne({
	rid,
	'u._id': Meteor.userId(),
}, {
	fields: {
		name: 1,
		autoTranslate: 1,
		autoTranslateLanguage: 1,
	},
}));

const username = mem(() => Meteor.user() && Meteor.user().username);
const useRealName = mem(() => RocketChat.settings.get('UI_Use_Real_Name'));
const blockDeleteInMinutes = mem(() => RocketChat.settings.get('Message_AllowDeleting_BlockDeleteInMinutes'));
const hasAtLeastOnePermission = mem((permission, rid) => RocketChat.authz.hasPermission(permission, rid));
const isDeleteAllowed = mem(() => RocketChat.settings.get('Message_AllowDeleting'));

Template.message.onCreated(function() {

	const msg = Template.currentData();

	this.wasEdited = (msg.editedAt != null) && !RocketChat.MessageTypes.isSystemMessage(msg);

	this.username = username();

	this.room = findRoom(msg.rid);

	this.subscription = findSubscription(msg.rid);

	this.useRealName = useRealName();

	this.blockDeleteInMinutes = blockDeleteInMinutes();

	this.hasPermission = hasAtLeastOnePermission('delete-message', msg.rid);
	this.isDeleteAllowed = isDeleteAllowed();

	return this.body = (() => {
		const isSystemMessage = RocketChat.MessageTypes.isSystemMessage(msg);
		const messageType = RocketChat.MessageTypes.getType(msg) || {};
		if (messageType.render) {
			return messageType.render(msg);
		}
		if (isSystemMessage) {
			msg.html = RocketChat.Markdown.parse(msg.html);
		}
		if (messageType.template) {
			return ''; // render template
		}
		if (messageType.message) {
			if (typeof messageType.data === 'function' && messageType.data(msg)) {
				return TAPi18n.__(messageType.message, messageType.data(msg));
			}
			return TAPi18n.__(messageType.message);
		}
		if (msg.u && msg.u.username === RocketChat.settings.get('Chatops_Username')) {
			msg.html = msg.msg;
			return RocketChat.callbacks.run('renderMentions', msg);
		}
		return renderMessageBody(msg);
	})();
});

Template.message.onViewRendered = function(context) {
	return this._domrange.onAttached((domRange) => {
		if (context.file && context.file.type === 'application/pdf') {
			Meteor.defer(() => { renderPdfToCanvas(context.file._id, context.attachments[0].title_link); });
		}
		const currentNode = domRange.lastNode();
		const currentDataset = currentNode.dataset;
		const getPreviousSentMessage = (currentNode) => {
			if ($(currentNode).hasClass('temp')) {
				return currentNode.previousElementSibling;
			}
			if (currentNode.previousElementSibling != null) {
				let previousValid = currentNode.previousElementSibling;
				while (previousValid != null && $(previousValid).hasClass('temp')) {
					previousValid = previousValid.previousElementSibling;
				}
				return previousValid;
			}
		};
		const previousNode = getPreviousSentMessage(currentNode);
		const nextNode = currentNode.nextElementSibling;
		const $currentNode = $(currentNode);
		const $nextNode = $(nextNode);
		if (previousNode == null) {
			$currentNode.addClass('new-day').removeClass('sequential');
		} else if (previousNode.dataset) {
			const previousDataset = previousNode.dataset;
			const previousMessageDate = new Date(parseInt(previousDataset.timestamp));
			const currentMessageDate = new Date(parseInt(currentDataset.timestamp));
			if (previousMessageDate.toDateString() !== currentMessageDate.toDateString()) {
				$currentNode.addClass('new-day').removeClass('sequential');
			} else {
				$currentNode.removeClass('new-day');
			}
			if (previousDataset.groupable === 'false' || currentDataset.groupable === 'false') {
				$currentNode.removeClass('sequential');
			} else if (previousDataset.username !== currentDataset.username || parseInt(currentDataset.timestamp) - parseInt(previousDataset.timestamp) > RocketChat.settings.get('Message_GroupingPeriod') * 1000) {
				$currentNode.removeClass('sequential');
			} else if (!$currentNode.hasClass('new-day')) {
				$currentNode.addClass('sequential');
			}
		}
		if (nextNode && nextNode.dataset) {
			const nextDataset = nextNode.dataset;
			if (nextDataset.date !== currentDataset.date) {
				$nextNode.addClass('new-day').removeClass('sequential');
			} else {
				$nextNode.removeClass('new-day');
			}
			if (nextDataset.groupable !== 'false') {
				if (nextDataset.username !== currentDataset.username || parseInt(nextDataset.timestamp) - parseInt(currentDataset.timestamp) > RocketChat.settings.get('Message_GroupingPeriod') * 1000) {
					$nextNode.removeClass('sequential');
				} else if (!$nextNode.hasClass('new-day') && !$currentNode.hasClass('temp')) {
					$nextNode.addClass('sequential');
				}
			}
		}
		if (nextNode == null) {
			const [el] = $(`#chat-window-${ context.rid }`);
			const view = el && Blaze.getView(el);
			const templateInstance = view && view.templateInstance();
			if (!templateInstance) {
				return;
			}

			if (currentNode.classList.contains('own') === true) {
				templateInstance.atBottom = true;
			}
			templateInstance.sendToBottomIfNecessary();
		}
	});
};

import _ from 'underscore';
import { Blaze } from 'meteor/blaze';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/tap:i18n';

import { timeAgo, formatDateAndTime } from '../../lib/client/lib/formatDate';
import { DateFormat } from '../../lib/client';
import { renderMessageBody, MessageTypes, MessageAction, call, normalizeThreadMessage } from '../../ui-utils/client';
import { RoomRoles, UserRoles, Roles, Messages } from '../../models/client';
import { callbacks } from '../../callbacks/client';
import { Markdown } from '../../markdown/client';
import { t, roomTypes, getURL } from '../../utils';
import { upsertMessage } from '../../ui-utils/client/lib/RoomHistoryManager';
import { messageArgs } from '../../ui-utils/client/lib/messageArgs';
import './message.html';
import './messageThread.html';

async function renderPdfToCanvas(canvasId, pdfLink) {
	const isSafari = /constructor/i.test(window.HTMLElement)
		|| ((p) => p.toString() === '[object SafariRemoteNotification]')(!window.safari
			|| (typeof window.safari !== 'undefined' && window.safari.pushNotification));

	if (isSafari) {
		const [, version] = /Version\/([0-9]+)/.exec(navigator.userAgent) || [null, 0];
		if (version <= 12) {
			return;
		}
	}

	if (!pdfLink || !/\.pdf$/i.test(pdfLink)) {
		return;
	}
	pdfLink = getURL(pdfLink);

	const canvas = document.getElementById(canvasId);
	if (!canvas) {
		return;
	}

	const pdfjsLib = await import('pdfjs-dist');
	pdfjsLib.GlobalWorkerOptions.workerSrc = `${ Meteor.absoluteUrl() }pdf.worker.min.js`;

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

const renderBody = (msg, settings) => {
	const isSystemMessage = MessageTypes.isSystemMessage(msg);
	const messageType = MessageTypes.getType(msg) || {};

	if (messageType.render) {
		msg = messageType.render(msg);
	} else if (messageType.template) {
		// render template
	} else if (messageType.message) {
		msg = TAPi18n.__(messageType.message, { ...typeof messageType.data === 'function' && messageType.data(msg) });
	} else if (msg.u && msg.u.username === settings.Chatops_Username) {
		msg.html = msg.msg;
		msg = callbacks.run('renderMentions', msg);
		msg = msg.html;
	} else {
		msg = renderMessageBody(msg);
	}

	if (isSystemMessage) {
		msg.html = Markdown.parse(msg.html);
	}
	return msg;
};

Template.message.helpers({
	body() {
		const { msg, settings } = this;
		return Tracker.nonreactive(() => renderBody(msg, settings));
	},
	and(a, b) {
		return a && b;
	},
	i18nReplyCounter() {
		const { msg } = this;
		return `<span class='reply-counter'>${ msg.tcount }</span>`;
	},
	i18nDiscussionCounter() {
		const { msg } = this;
		return `<span class='reply-counter'>${ msg.dcount }</span>`;
	},
	formatDateAndTime,
	encodeURI(text) {
		return encodeURI(text);
	},
	broadcast() {
		const { msg, room = {}, u } = this;
		return !msg.private && !msg.t && msg.u._id !== u._id && room && room.broadcast;
	},
	isIgnored() {
		const { ignored, msg } = this;
		const isIgnored = typeof ignored !== 'undefined' ? ignored : msg.ignored;
		return isIgnored;
	},
	ignoredClass() {
		const { ignored, msg } = this;
		const isIgnored = typeof ignored !== 'undefined' ? ignored : msg.ignored;
		return isIgnored ? 'message--ignored' : '';
	},
	isDecrypting() {
		const { msg } = this;
		return msg.e2e === 'pending';
	},
	isBot() {
		const { msg } = this;
		return msg.bot && 'bot';
	},
	isNewsfeed() {
		const { room } = this;
		if (room.t === 'n') {
			return true;
		}
		return false;
	},
	originalChannelNameForNewsfeed() {
		const { msg } = this;
		return msg.originalRoomNameForNewsfeed;
	},
	roleTags() {
		const { msg, hideRoles, settings } = this;
		if (settings.hideRoles || hideRoles) {
			return [];
		}

		if (!msg.u || !msg.u._id) {
			return [];
		}
		const userRoles = UserRoles.findOne(msg.u._id);
		const roomRoles = RoomRoles.findOne({
			'u._id': msg.u._id,
			rid: msg.rid,
		});
		const roles = [...(userRoles && userRoles.roles) || [], ...(roomRoles && roomRoles.roles) || []];
		return Roles.find({
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
		});
	},
	isGroupable() {
		const { msg, room = {}, settings, groupable } = this;
		if (groupable === false || settings.allowGroup === false || room.broadcast || msg.groupable === false || (MessageTypes.isSystemMessage(msg) && !msg.tmid)) {
			return 'false';
		}
	},
	sequentialClass() {
		const { msg, groupable } = this;
		if (MessageTypes.isSystemMessage(msg) && !msg.tmid) {
			return;
		}
		return groupable !== false && msg.groupable !== false && 'sequential';
	},
	avatarFromUsername() {
		const { msg } = this;

		if (msg.avatar != null && msg.avatar[0] === '@') {
			return msg.avatar.replace(/^@/, '');
		}
	},
	getName() {
		const { msg, settings } = this;
		if (msg.alias) {
			return msg.alias;
		}
		if (!msg.u) {
			return '';
		}
		return (settings.UI_Use_Real_Name && msg.u.name) || msg.u.username;
	},
	showUsername() {
		const { msg, settings } = this;
		return msg.alias || (settings.UI_Use_Real_Name && msg.u && msg.u.name);
	},
	own() {
		const { msg, u } = this;
		if (msg.u && msg.u._id === u._id) {
			return 'own';
		}
	},
	timestamp() {
		const { msg } = this;
		return +msg.ts;
	},
	chatops() {
		const { msg, settings } = this;
		if (msg.u && msg.u.username === settings.Chatops_Username) {
			return 'chatops-message';
		}
	},
	time() {
		const { msg, timeAgo: useTimeAgo } = this;

		return useTimeAgo ? timeAgo(msg.ts) : DateFormat.formatTime(msg.ts);
	},
	date() {
		const { msg } = this;
		return DateFormat.formatDate(msg.ts);
	},
	isTemp() {
		const { msg } = this;
		if (msg.temp === true) {
			return 'temp';
		}
	},
	threadMessage() {
		const { msg } = this;
		return normalizeThreadMessage(msg);
	},
	bodyClass() {
		const { msg } = this;
		return MessageTypes.isSystemMessage(msg) ? 'color-info-font-color' : 'color-primary-font-color';
	},
	system(returnClass) {
		const { msg } = this;
		if (MessageTypes.isSystemMessage(msg)) {
			if (returnClass) {
				return 'color-info-font-color';
			}
			return 'system';
		}
	},
	showTranslated() {
		const { msg, subscription, settings, u } = this;
		if (settings.AutoTranslate_Enabled && msg.u && msg.u._id !== u._id && !MessageTypes.isSystemMessage(msg)) {
			const autoTranslate = subscription && subscription.autoTranslate;
			return msg.autoTranslateFetching || (!!autoTranslate !== !!msg.autoTranslateShowInverse && msg.translations && msg.translations[settings.translateLanguage]);
		}
	},
	edited() {
		return Template.instance().wasEdited;
	},
	editTime() {
		const { msg } = this;
		if (Template.instance().wasEdited) {
			return DateFormat.formatDateAndTime(msg.editedAt);
		}
	},
	editedBy() {
		if (!Template.instance().wasEdited) {
			return '';
		}
		const { msg } = this;
		// try to return the username of the editor,
		// otherwise a special "?" character that will be
		// rendered as a special avatar
		return (msg.editedBy && msg.editedBy.username) || '?';
	},
	label() {
		const { msg } = this;

		if (msg.i18nLabel) {
			return t(msg.i18nLabel);
		} if (msg.label) {
			return msg.label;
		}
	},
	hasOembed() {
		const { msg, settings } = this;
		// there is no URLs, there is no template to show the oembed (oembed package removed) or oembed is not enable
		if (!(msg.urls && msg.urls.length > 0) || !Template.oembedBaseWidget || !settings.API_Embed) {
			return false;
		}

		// check if oembed is disabled for message's sender
		if ((settings.API_EmbedDisabledFor || '').split(',').map((username) => username.trim()).includes(msg.u && msg.u.username)) {
			return false;
		}
		return true;
	},
	reactions() {
		const { msg: { reactions = {} }, u: { username: myUsername, name: myName } } = this;

		return Object.entries(reactions)
			.map(([emoji, reaction]) => {
				const myDisplayName = reaction.names ? myName : `@${ myUsername }`;
				const displayNames = reaction.names || reaction.usernames.map((username) => `@${ username }`);
				const selectedDisplayNames = displayNames.slice(0, 15).filter((displayName) => displayName !== myDisplayName);

				if (displayNames.some((displayName) => displayName === myDisplayName)) {
					selectedDisplayNames.unshift(t('You'));
				}

				let usernames;

				if (displayNames.length > 15) {
					usernames = `${ selectedDisplayNames.join(', ') }${ t('And_more', { length: displayNames.length - 15 }).toLowerCase() }`;
				} else if (displayNames.length > 1) {
					usernames = `${ selectedDisplayNames.slice(0, -1).join(', ') } ${ t('and') } ${ selectedDisplayNames[selectedDisplayNames.length - 1] }`;
				} else {
					usernames = selectedDisplayNames[0];
				}

				return {
					emoji,
					count: displayNames.length,
					usernames,
					reaction: ` ${ t('Reacted_with').toLowerCase() } ${ emoji }`,
					userReacted: displayNames.indexOf(myDisplayName) > -1,
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
		const { msg } = this;
		if (_.isEmpty(msg.reactions)) {
			return 'hidden';
		}
	},
	hideMessageActions() {
		const { msg } = this;

		return msg.private || MessageTypes.isSystemMessage(msg);
	},
	actionLinks() {
		const { msg } = this;
		// remove 'method_id' and 'params' properties
		return _.map(msg.actionLinks, function(actionLink, key) {
			return _.extend({
				id: key,
			}, _.omit(actionLink, 'method_id', 'params'));
		});
	},
	hideActionLinks() {
		const { msg } = this;
		if (_.isEmpty(msg.actionLinks)) {
			return 'hidden';
		}
	},
	injectIndex(data, index) {
		data.index = index;
	},
	channelName() {
		const { subscription } = this;
		// const subscription = Subscriptions.findOne({ rid: this.rid });
		return subscription && subscription.name;
	},
	roomIcon() {
		const { room } = this;
		if (room && room.t === 'd') {
			return 'at';
		}
		return roomTypes.getIcon(room);
	},
	customClass() {
		const { customClass, msg } = this;
		return customClass || msg.customClass;
	},
	fromSearch() {
		const { customClass, msg } = this;
		return [msg.customClass, customClass].includes('search');
	},
	actionContext() {
		const { msg } = this;
		return msg.actionContext;
	},
	messageActions(group) {
		const { msg, context: ctx } = this;
		let messageGroup = group;
		let context = ctx || msg.actionContext;

		if (!group) {
			messageGroup = 'message';
		}

		if (!context) {
			context = 'message';
		}

		return MessageAction.getButtons(this, context, messageGroup);
	},
	isSnippet() {
		const { msg } = this;
		return msg.actionContext === 'snippeted';
	},
	isThreadReply() {
		const { msg: { tmid, t }, settings: { showreply } } = this;
		return !!(tmid && showreply && (!t || t === 'e2e'));
	},
	collapsed() {
		const { msg: { tmid, collapsed }, settings: { showreply }, shouldCollapseReplies } = this;
		const isCollapsedThreadReply = shouldCollapseReplies && tmid && showreply && collapsed !== false;
		if (isCollapsedThreadReply) {
			return 'collapsed';
		}
	},
	collapseSwitchClass() {
		const { msg: { collapsed = true } } = this;
		return collapsed ? 'icon-right-dir' : 'icon-down-dir';
	},
	parentMessage() {
		const { msg: { threadMsg } } = this;
		return threadMsg;
	},
});


const findParentMessage = (() => {
	const waiting = [];

	const getMessages = _.debounce(async function() {
		const uid = Tracker.nonreactive(() => Meteor.userId());
		const _tmp = [...waiting];
		waiting.length = 0;
		(await call('getMessages', _tmp)).map((msg) => upsertMessage({ msg, uid }));
	}, 500);

	return (tmid) => {
		if (waiting.indexOf(tmid) > -1) {
			return;
		}

		const message = Messages.findOne({ _id: tmid });
		if (message) {
			const uid = Tracker.nonreactive(() => Meteor.userId());
			return Messages.update({ tmid, repliesCount: { $exists: 0 } }, {
				$set: {
					following: message.replies && message.replies.indexOf(uid) > -1,
					threadMsg: normalizeThreadMessage(message),
					repliesCount: message.tcount,
				},
			}, { multi: true });
		}

		waiting.push(tmid);
		getMessages();
	};
})();

Template.message.onCreated(function() {
	const { msg, shouldCollapseReplies } = Template.currentData();

	this.wasEdited = msg.editedAt && !MessageTypes.isSystemMessage(msg);
	if (shouldCollapseReplies && msg.tmid && !msg.threadMsg) {
		findParentMessage(msg.tmid);
	}
});

const hasTempClass = (node) => node.classList.contains('temp');

const getPreviousSentMessage = (currentNode) => {
	if (hasTempClass(currentNode)) {
		return currentNode.previousElementSibling;
	}
	if (currentNode.previousElementSibling != null) {
		let previousValid = currentNode.previousElementSibling;
		while (previousValid != null && (hasTempClass(previousValid) || !previousValid.classList.contains('message'))) {
			previousValid = previousValid.previousElementSibling;
		}
		return previousValid;
	}
};

const isNewDay = (currentNode, previousNode, forceDate, showDateSeparator) => {
	if (!showDateSeparator) {
		return false;
	}

	if (forceDate || !previousNode) {
		return true;
	}

	const { dataset: currentDataset } = currentNode;
	const { dataset: previousDataset } = previousNode;
	const previousMessageDate = new Date(parseInt(previousDataset.timestamp));
	const currentMessageDate = new Date(parseInt(currentDataset.timestamp));

	if (previousMessageDate.toDateString() !== currentMessageDate.toDateString()) {
		return true;
	}

	return false;
};

const isSequential = (currentNode, previousNode, forceDate, period, showDateSeparator, shouldCollapseReplies) => {
	if (!previousNode) {
		return false;
	}

	if (showDateSeparator && forceDate) {
		return false;
	}

	const { dataset: currentDataset } = currentNode;
	const { dataset: previousDataset } = previousNode;
	const previousMessageDate = new Date(parseInt(previousDataset.timestamp));
	const currentMessageDate = new Date(parseInt(currentDataset.timestamp));

	if (showDateSeparator && previousMessageDate.toDateString() !== currentMessageDate.toDateString()) {
		return false;
	}

	if (shouldCollapseReplies && currentDataset.tmid) {
		return previousDataset.id === currentDataset.tmid || previousDataset.tmid === currentDataset.tmid;
	}

	if (previousDataset.tmid && !currentDataset.tmid) {
		return false;
	}

	if ([previousDataset.groupable, currentDataset.groupable].includes('false')) {
		return false;
	}

	if (previousDataset.username !== currentDataset.username) {
		return false;
	}

	if (previousDataset.alias !== currentDataset.alias) {
		return false;
	}

	if (parseInt(currentDataset.timestamp) - parseInt(previousDataset.timestamp) <= period) {
		return true;
	}

	return false;
};

const processSequentials = ({ currentNode, settings, forceDate, showDateSeparator = true, groupable, msg, shouldCollapseReplies }) => {
	if (!showDateSeparator && !groupable) {
		return;
	}
	if (msg.file && msg.file.type === 'application/pdf') {
		Meteor.defer(() => { renderPdfToCanvas(msg.file._id, msg.attachments[0].title_link); });
	}
	// const currentDataset = currentNode.dataset;
	const previousNode = getPreviousSentMessage(currentNode);
	const nextNode = currentNode.nextElementSibling;

	if (isSequential(currentNode, previousNode, forceDate, settings.Message_GroupingPeriod, showDateSeparator, shouldCollapseReplies)) {
		currentNode.classList.add('sequential');
	} else {
		currentNode.classList.remove('sequential');
	}

	if (isNewDay(currentNode, previousNode, forceDate, showDateSeparator)) {
		currentNode.classList.add('new-day');
	} else {
		currentNode.classList.remove('new-day');
	}

	if (nextNode && nextNode.dataset) {
		if (isSequential(nextNode, currentNode, forceDate, settings.Message_GroupingPeriod, showDateSeparator, shouldCollapseReplies)) {
			nextNode.classList.add('sequential');
		} else {
			nextNode.classList.remove('sequential');
		}

		if (isNewDay(nextNode, currentNode, forceDate, showDateSeparator)) {
			nextNode.classList.add('new-day');
		} else {
			nextNode.classList.remove('new-day');
		}
	} else if (shouldCollapseReplies) {
		const [el] = $(`#chat-window-${ msg.rid }`);
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
};

Template.message.onRendered(function() { // duplicate of onViewRendered(NRR) the onRendered works only for non nrr templates
	this.autorun(() => {
		const currentNode = this.firstNode;
		processSequentials({ currentNode, ...messageArgs(Template.currentData()) });
	});
});

Template.message.onViewRendered = function() {
	const args = messageArgs(Template.currentData());
	// processSequentials({ currentNode, ...messageArgs(Template.currentData()) });
	return this._domrange.onAttached((domRange) => {
		const currentNode = domRange.lastNode();
		processSequentials({ currentNode, ...args });
	});
};

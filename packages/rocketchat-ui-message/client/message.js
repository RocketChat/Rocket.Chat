import moment from 'moment';

Template.message.helpers({
	isBot() {
		if (this.bot != null) {
			return 'bot';
		}
	},
	roleTags() {
		const user = Meteor.user();
		// test user -> settings -> preferences -> hideRoles
		if (!RocketChat.settings.get('UI_DisplayRoles') || ['settings', 'preferences', 'hideRoles'].reduce((obj, field) => typeof obj !== 'undefined' && obj[field], user)) {
			return [];
		}

		if (!this.u || !this.u._id) {
			return [];
		}
		/* globals UserRoles RoomRoles */
		const userRoles = UserRoles.findOne(this.u._id);
		const roomRoles = RoomRoles.findOne({
			'u._id': this.u._id,
			rid: this.rid
		});
		const roles = [...(userRoles && userRoles.roles) || [], ...(roomRoles && roomRoles.roles) || []];
		return RocketChat.models.Roles.find({
			_id: {
				$in: roles
			},
			description: {
				$exists: 1,
				$ne: ''
			}
		}, {
			fields: {
				description: 1
			}
		});
	},
	isGroupable() {
		if (this.groupable === false) {
			return 'false';
		}
	},
	isSequential() {
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
		return (RocketChat.settings.get('UI_Use_Real_Name') && this.u.name) || this.u.username;
	},
	showUsername() {
		return this.alias || RocketChat.settings.get('UI_Use_Real_Name') && this.u && this.u.name;
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
		return moment(this.ts).format(RocketChat.settings.get('Message_TimeFormat'));
	},
	date() {
		return moment(this.ts).format(RocketChat.settings.get('Message_DateFormat'));
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
		if (RocketChat.settings.get('AutoTranslate_Enabled') && ((ref = this.u) != null ? ref._id : void 0) !== Meteor.userId() && !RocketChat.MessageTypes.isSystemMessage(this)) {
			subscription = RocketChat.models.Subscriptions.findOne({
				rid: this.rid,
				'u._id': Meteor.userId()
			}, {
				fields: {
					autoTranslate: 1,
					autoTranslateLanguage: 1
				}
			});
			const language = RocketChat.AutoTranslate.getLanguage(this.rid);
			return this.autoTranslateFetching || ((subscription != null ? subscription.autoTranslate : void 0) !== this.autoTranslateShowInverse && this.translations && this.translations[language]);
		}
	},
	edited() {
		return Template.instance().wasEdited;
	},
	editTime() {
		if (Template.instance().wasEdited) {
			return moment(this.editedAt).format(`${ RocketChat.settings.get('Message_DateFormat') } ${ RocketChat.settings.get('Message_TimeFormat') }`);
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
	canEdit() {
		const hasPermission = RocketChat.authz.hasAtLeastOnePermission('edit-message', this.rid);
		const isEditAllowed = RocketChat.settings.get('Message_AllowEditing');
		const editOwn = ((ref = this.u) != null ? ref._id : void 0) === Meteor.userId();
		if (!(hasPermission || (isEditAllowed && editOwn))) {
			return;
		}
		const blockEditInMinutes = RocketChat.settings.get('Message_AllowEditing_BlockEditInMinutes');
		if ((blockEditInMinutes != null) && blockEditInMinutes !== 0) {
			if (this.ts != null) {
				msgTs = moment(this.ts);
			}
			if (msgTs != null) {
				currentTsDiff = moment().diff(msgTs, 'minutes');
			}
			return currentTsDiff < blockEditInMinutes;
		} else {
			return true;
		}
	},
	canDelete() {
		let blockDeleteInMinutes, currentTsDiff, deleteOwn, hasPermission, isDeleteAllowed, msgTs, ref;
		hasPermission = RocketChat.authz.hasAtLeastOnePermission('delete-message', this.rid);
		isDeleteAllowed = RocketChat.settings.get('Message_AllowDeleting');
		deleteOwn = ((ref = this.u) != null ? ref._id : void 0) === Meteor.userId();
		if (!(hasPermission || (isDeleteAllowed && deleteOwn))) {
			return;
		}
		blockDeleteInMinutes = RocketChat.settings.get('Message_AllowDeleting_BlockDeleteInMinutes');
		if ((blockDeleteInMinutes != null) && blockDeleteInMinutes !== 0) {
			if (this.ts != null) {
				msgTs = moment(this.ts);
			}
			if (msgTs != null) {
				currentTsDiff = moment().diff(msgTs, 'minutes');
			}
			return currentTsDiff < blockDeleteInMinutes;
		} else {
			return true;
		}
	},
	showEditedStatus() {
		return RocketChat.settings.get('Message_ShowEditedStatus');
	},
	label() {
		if (this.i18nLabel) {
			return t(this.i18nLabel);
		} else if (this.label) {
			return this.label;
		}
	},
	hasOembed() {
		let ref, ref1, ref2, ref3;
		if (!(((ref = this.urls) != null ? ref.length : void 0) > 0 && (Template.oembedBaseWidget != null) && RocketChat.settings.get('API_Embed'))) {
			return false;
		}
		if (ref1 = (ref2 = this.u) != null ? ref2.username : void 0, indexOf.call((ref3 = RocketChat.settings.get('API_EmbedDisabledFor')) != null ? ref3.split(',').map(function(username) {
			return username.trim();
		}) : void 0, ref1) >= 0) {
			return false;
		}
		return true;
	},
	reactions() {
		let emoji, msgReactions, reaction, ref, total, userUsername, usernames;
		msgReactions = [];
		userUsername = Meteor.user().username;
		ref = this.reactions;
		for (emoji in ref) {
			reaction = ref[emoji];
			total = reaction.usernames.length;
			usernames = `@${ reaction.usernames.slice(0, 15).join(', @') }`;
			usernames = usernames.replace(`@${ userUsername }`, t('You').toLowerCase());
			if (total > 15) {
				usernames = `${ usernames } ${ t('And_more', {
					length: total - 15
				}).toLowerCase() }`;
			} else {
				usernames = usernames.replace(/,([^,]+)$/, ` ${ t('and') }$1`);
			}
			if (usernames[0] !== '@') {
				usernames = usernames[0].toUpperCase() + usernames.substr(1);
			}
			msgReactions.push({
				emoji,
				count: reaction.usernames.length,
				usernames,
				reaction: ` ${ t('Reacted_with').toLowerCase() } ${ emoji }`,
				userReacted: reaction.usernames.indexOf(userUsername) > -1
			});
		}
		return msgReactions;
	},
	markUserReaction(reaction) {
		if (reaction.userReacted) {
			return {
				'class': 'selected'
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
				id: key
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
		let subscription;
		subscription = RocketChat.models.Subscriptions.findOne({
			rid: this.rid
		});
		if (subscription == null) {
			return 'hidden';
		}
	},
	hideUsernames() {
		let prefs, ref, ref1;
		prefs = (ref = Meteor.user()) != null ? (ref1 = ref.settings) != null ? ref1.preferences : void 0 : void 0;
		if (prefs != null ? prefs.hideUsernames : void 0) {

		}
	}
});

Template.message.onCreated(function() {
	let msg;
	msg = Template.currentData();
	this.wasEdited = (msg.editedAt != null) && !RocketChat.MessageTypes.isSystemMessage(msg);
	return this.body = (function() {
		let isSystemMessage, messageType, ref;
		isSystemMessage = RocketChat.MessageTypes.isSystemMessage(msg);
		messageType = RocketChat.MessageTypes.getType(msg);
		if ((messageType != null ? messageType.render : void 0) != null) {
			msg = messageType.render(msg);
		} else if ((messageType != null ? messageType.template : void 0) != null) {

		} else if ((messageType != null ? messageType.message : void 0) != null) {
			if ((typeof messageType.data === 'function' ? messageType.data(msg) : void 0) != null) {
				msg = TAPi18n.__(messageType.message, messageType.data(msg));
			} else {
				msg = TAPi18n.__(messageType.message);
			}
		} else if (((ref = msg.u) != null ? ref.username : void 0) === RocketChat.settings.get('Chatops_Username')) {
			msg.html = msg.msg;
			msg = RocketChat.callbacks.run('renderMentions', msg);
			msg = msg.html;
		} else {
			msg = renderMessageBody(msg);
		}
		if (isSystemMessage) {
			return RocketChat.Markdown(msg);
		} else {
			return msg;
		}
	}());
});

Template.message.onViewRendered = function(context) {
	let view;
	view = this;
	return this._domrange.onAttached(function(domRange) {
		let $currentNode, $nextNode, currentDataset, currentMessageDate, currentNode, newMessage, nextDataset, nextNode, previousDataset, previousMessageDate, previousNode, ref, templateInstance;
		currentNode = domRange.lastNode();
		currentDataset = currentNode.dataset;
		previousNode = currentNode.previousElementSibling;
		nextNode = currentNode.nextElementSibling;
		$currentNode = $(currentNode);
		$nextNode = $(nextNode);
		if (previousNode == null) {
			$currentNode.addClass('new-day').removeClass('sequential');
		} else if ((previousNode != null ? previousNode.dataset : void 0) != null) {
			previousDataset = previousNode.dataset;
			previousMessageDate = new Date(parseInt(previousDataset.timestamp));
			currentMessageDate = new Date(parseInt(currentDataset.timestamp));
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
		if ((nextNode != null ? nextNode.dataset : void 0) != null) {
			nextDataset = nextNode.dataset;
			if (nextDataset.date !== currentDataset.date) {
				$nextNode.addClass('new-day').removeClass('sequential');
			} else {
				$nextNode.removeClass('new-day');
			}
			if (nextDataset.groupable !== 'false') {
				if (nextDataset.username !== currentDataset.username || parseInt(nextDataset.timestamp) - parseInt(currentDataset.timestamp) > RocketChat.settings.get('Message_GroupingPeriod') * 1000) {
					$nextNode.removeClass('sequential');
				} else if (!$nextNode.hasClass('new-day')) {
					$nextNode.addClass('sequential');
				}
			}
		}
		if (nextNode == null) {
			templateInstance = $(`#chat-window-${ context.rid }`)[0] ? (ref = Blaze.getView($(`#chat-window-${ context.rid }`)[0])) != null ? ref.templateInstance() : void 0 : null;
			if (currentNode.classList.contains('own') === true) {
				return templateInstance != null ? templateInstance.atBottom = true : void 0;
			} else if ((templateInstance != null ? templateInstance.firstNode : void 0) && (templateInstance != null ? templateInstance.atBottom : void 0) === false) {
				newMessage = templateInstance != null ? templateInstance.find('.new-message') : void 0;
				return newMessage != null ? newMessage.className = 'new-message background-primary-action-color color-content-background-color ' : void 0;
			}
		}
	});
};

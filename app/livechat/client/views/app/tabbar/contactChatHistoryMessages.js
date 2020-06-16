import { Template } from 'meteor/templating';
import './contactChatHistoryMessages.html';
import { ReactiveVar } from 'meteor/reactive-var';
import _ from 'underscore';

import { messageContext } from '../../../../../ui-utils/client/lib/messageContext';
import { APIClient } from '../../../../../utils/client';

const LIMIT_DEFAULT = 50;

Template.contactChatHistoryMessages.helpers({
	messages() {
		return Template.instance().messages.get();
	},
	messageContext() {
		const result = messageContext.call(this, { rid: Template.instance().rid });
		return {
			...result,
			settings: {
				...result.settings,
				showReplyButton: false,
				showreply: false,
				hideRoles: true,
			},
		};
	},
	hasMore() {
		return Template.instance().hasMore.get();
	},
	searching() {
		return Template.instance().searchTerm.get().length > 0;
	},
	empty() {
		return Template.instance().messages.get().length === 0;
	},
});

Template.contactChatHistoryMessages.events({
	'click .js-back'(e, instance) {
		return instance.clear();
	},
	'scroll .js-list': _.throttle(function(e, instance) {
		if (e.target.scrollTop >= e.target.scrollHeight - e.target.clientHeight && instance.hasMore.get()) {
			instance.limit.set(instance.limit.get() + LIMIT_DEFAULT);
		}
	}, 200),
	'keyup #message-search': _.debounce(function(e, instance) {
		if (e.keyCode === 13) {
			return e.preventDefault();
		}

		const { value } = e.target;

		if (e.keyCode === 40 || e.keyCode === 38) {
			return e.preventDefault();
		}

		instance.limit.set(0);
		instance.searchTerm.set(value);
	}, 300),
});

Template.contactChatHistoryMessages.onCreated(function() {
	const currentData = Template.currentData();
	this.rid = currentData.rid;
	this.messages = new ReactiveVar([]);
	this.hasMore = new ReactiveVar(true);
	this.limit = new ReactiveVar(0);
	this.searchTerm = new ReactiveVar('');

	this.displayMessages = ({ messages /* , total */ }) => {
		this.messages.set(messages);
		// this.hasMore.set(total > limit);
		this.hasMore.set(false);
	};

	this.autorun(async () => {
		const limit = this.limit.get();
		const searchTerm = this.searchTerm.get();

		if (searchTerm !== '') {
			return this.displayMessages(await APIClient.v1.get(`chat.search/?roomId=${ this.rid }&searchText=${ searchTerm }&count=${ LIMIT_DEFAULT }&offset=${ 0 }&sort={"ts": 1}`));
		}

		return this.displayMessages(await APIClient.v1.get(`channels.messages/?roomId=${ this.rid }&count=${ LIMIT_DEFAULT }&offset=${ limit }&sort={"ts": 1}&query={"$or": [ {"t": {"$exists": false} }, {"t": "livechat-close"} ] }`));
	});

	this.autorun(() => {
		if (currentData.clear != null) {
			this.clear = currentData.clear;
		}
	});
});

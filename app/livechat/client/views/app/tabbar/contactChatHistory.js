import { Tracker } from 'meteor/tracker';
import { Template } from 'meteor/templating';
import moment from 'moment';
import { ReactiveVar } from 'meteor/reactive-var';
import './contactChatHistory.html';
import './contactChatHistoryItem.html';
import _ from 'underscore';

import { t, APIClient } from '../../../../../utils/client';

const HISTORY_LIMIT = 50;

Template.contactChatHistory.helpers({
	isReady() {
		return Template.instance().isReady.get();
	},
	hasChatHistory() {
		return Template.instance().history.get().length > 0;
	},
	history() {
		return Template.instance().history.get();
	},
	isLoading() {
		return Template.instance().isLoading.get();
	},
	isSearching() {
		return Template.instance().searchTerm.get().length > 0;
	},
	showChatHistoryMessages() {
		return Template.instance().showChatHistoryMessages.get();
	},
	chatHistoryMessagesContext() {
		return {
			tabBar: Template.instance().tabBar,
			clear: Template.instance().returnChatHistoryList,
			...Template.instance().chatHistoryMessagesContext.get(),
		};
	},
	canSearch() {
		return Template.instance().canSearch.get();
	},
});

Template.contactChatHistory.onCreated(async function () {
	const currentData = Template.currentData();
	this.offset = new ReactiveVar(0);
	this.visitorId = new ReactiveVar();
	this.history = new ReactiveVar([]);
	this.searchTerm = new ReactiveVar('');
	this.hasMore = new ReactiveVar(true);
	this.isLoading = new ReactiveVar(true);
	this.chatHistoryMessagesContext = new ReactiveVar();
	this.showChatHistoryMessages = new ReactiveVar(false);
	this.limit = new ReactiveVar(HISTORY_LIMIT);
	this.isReady = new ReactiveVar(false);
	this.canSearch = new ReactiveVar(false);
	this.tabBar = currentData.tabBar;

	this.returnChatHistoryList = () => {
		this.showChatHistoryMessages.set(false);
		this.chatHistoryMessagesContext.set();
	};

	this.autorun(async () => {
		if (!this.visitorId.get() || !currentData || !currentData.rid) {
			return;
		}

		const limit = this.limit.get();
		const offset = this.offset.get();
		const searchTerm = this.searchTerm.get();

		let baseUrl = `livechat/visitors.searchChats/room/${
			currentData.rid
		}/visitor/${this.visitorId.get()}?count=${limit}&offset=${offset}&closedChatsOnly=true&servedChatsOnly=true`;
		if (searchTerm) {
			baseUrl += `&searchText=${searchTerm}`;
		}

		this.isLoading.set(true);
		const { history, total } = await APIClient.v1.get(baseUrl);
		this.history.set(offset === 0 ? history : this.history.get().concat(history));
		this.hasMore.set(total > this.history.get().length);
		this.isLoading.set(false);
	});

	this.autorun(async () => {
		const { room } = await APIClient.v1.get(`rooms.info?roomId=${currentData.rid}`);
		if (room?.v) {
			this.visitorId.set(room.v._id);
		}
	});
});

Template.contactChatHistory.onRendered(function () {
	Tracker.autorun((computation) => {
		if (this.isLoading.get()) {
			return;
		}

		const history = this.history.get();
		this.canSearch.set(history && history.length > 0);
		this.isReady.set(true);

		computation.stop();
	});
});

Template.contactChatHistory.events({
	'scroll .js-list': _.throttle(function (e, instance) {
		if (e.target.scrollTop >= e.target.scrollHeight - e.target.clientHeight - 10 && instance.hasMore.get()) {
			instance.offset.set(instance.offset.get() + instance.limit.get());
		}
	}, 200),
	'click .chat-history-item'(event, instance) {
		event.preventDefault();
		event.stopPropagation();

		const { _id: rid, v: { name, username } = {}, closedAt } = this;

		const closedAtLabel = t('Closed_At');
		const closedDay = moment(closedAt).format('MMM D YYYY');

		instance.chatHistoryMessagesContext.set({
			label: `${name || username}, ${closedAtLabel} ${closedDay}`,
			rid,
		});

		instance.showChatHistoryMessages.set(true);
	},
	'keyup #chat-search': _.debounce(function (e, instance) {
		if (e.keyCode === 13) {
			return e.preventDefault();
		}

		const { value } = e.target;

		if (e.keyCode === 40 || e.keyCode === 38) {
			return e.preventDefault();
		}

		instance.offset.set(0);
		instance.searchTerm.set(value);
	}, 300),
});

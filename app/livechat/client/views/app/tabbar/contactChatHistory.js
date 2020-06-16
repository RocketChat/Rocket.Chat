import { Template } from 'meteor/templating';
import moment from 'moment';
import { ReactiveVar } from 'meteor/reactive-var';
import './contactChatHistory.html';
import './contactChatHistoryItem.html';
import _ from 'underscore';

import { t, APIClient } from '../../../../../utils/client';


const HISTORY_COUNT = 50;

Template.contactChatHistory.helpers({
	hasChatHistory() {
		return Template.instance().history.get().length > 0;
	},
	history() {
		return Template.instance().history.get();
	},
	title() {
		let title = moment(this.ts).format('L LTS');

		if (this.label) {
			title += ` - ${ this.label }`;
		}
		return title;
	},
	isLoading() {
		return Template.instance().isLoading.get();
	},
	showChatHistoryMessages() {
		return Template.instance().showChatHistoryMessages.get();
	},
	chatHistoryMessagesDetail() {
		return {
			tabBar: Template.instance().tabBar,
			clear: Template.instance().returnChatHistoryList,
			...Template.instance().chatHistoryMessagesDetail.get(),
		};
	},
});

Template.contactChatHistory.onCreated(async function() {
	const currentData = Template.currentData();
	this.offset = new ReactiveVar(0);
	this.total = new ReactiveVar(0);
	this.visitorId = new ReactiveVar();
	this.history = new ReactiveVar([]);
	this.searchTerm = new ReactiveVar();
	this.hasMore = new ReactiveVar(true);
	this.isLoading = new ReactiveVar(true);
	this.chatHistoryMessagesDetail = new ReactiveVar();
	this.showChatHistoryMessages = new ReactiveVar(false);

	this.tabBar = currentData.tabBar;

	this.returnChatHistoryList = () => {
		this.showChatHistoryMessages.set(false);
		this.chatHistoryMessagesDetail.set();

		this.tabBar.setData({
			label: 'Contact_Chat_History',
			icon: 'clock',
		});
	};

	this.loadHistory = async () => {
		if (!this.visitorId.get() || !currentData || !currentData.rid) {
			return;
		}

		this.isLoading.set(true);
		const offset = this.offset.get();
		const searchTerm = this.searchTerm.get();

		let baseUrl = `livechat/visitors.chatHistory/room/${ currentData.rid }/visitor/${ this.visitorId.get() }?count=${ HISTORY_COUNT }&offset=${ offset }&closedChatsOnly=true&servedChatsOnly=true`;
		if (searchTerm) {
			baseUrl += `&searchText=${ searchTerm }`;
		}
		const { history, total } = await APIClient.v1.get(baseUrl);
		this.history.set(history);

		this.total.set(total);
		this.hasMore.set(total > offset);
		this.isLoading.set(false);
	};

	this.autorun(async () => {
		const { room } = await APIClient.v1.get(`rooms.info?roomId=${ currentData.rid }`);
		if (room?.v) {
			this.visitorId.set(room.v._id);
			this.loadHistory();
		}
	});
});

Template.contactChatHistory.events({
	'scroll .js-list': _.throttle(function(e, instance) {
		if (e.target.scrollTop >= e.target.scrollHeight - e.target.clientHeight - 10 && instance.hasMore.get()) {
			instance.offset.set(instance.offset.get() + HISTORY_COUNT);
		}
	}, 200),
	'click .list-chat-item'(event, instance) {
		event.preventDefault();
		event.stopPropagation();

		const { _id: rid, v: { name, username } = { }, closedAt } = this;

		const closedAtLabel = t('Closed_At');
		const closedDay = moment(closedAt).format('MMM D YYYY');

		instance.chatHistoryMessagesDetail.set({
			label: `${ name || username }, ${ closedAtLabel } ${ closedDay }`,
			rid,
		});

		instance.showChatHistoryMessages.set(true);
	},
});

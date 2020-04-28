import { Template } from 'meteor/templating';
import moment from 'moment';
import { ReactiveVar } from 'meteor/reactive-var';
import './customerChatHistory.html';
import './chatRoomHistoryItem.html';
import './chatRoomSearchItem.html';
import _ from 'underscore';

import { APIClient } from '../../../../../utils/client';

const ITEMS_COUNT = 50;
Template.customerChatHistory.helpers({

	hasChatHistory() {
		// will return if user has any chatHistory or not
		return Template.instance().hasHistory.get();
	},
	isSearching() {
		return Template.instance().isSearching.get();
	},
	isAllChat() {
		// will return is have to load all chat
		return Template.instance().isAllChat.get();
	},
	isChatClicked() {
		// will return that if you have clicked in a single chatHistory
		return Template.instance().isChatClicked.get();
	},
	isfound() {
		// will return if find any search result
		return Template.instance().isFound.get();
	},
	searchResults() {
		// will return search result
		return 	Template.instance().searchResult.get();
	},
	previousChats() {
		// will return pervious chats list
		return Template.instance().history.get();
	},
	clickRid() {
		return Template.instance().clickRid.get();
	},
	clickToken() {
		return Template.instance().clickToken.get();
	},
	title() {
		let title = moment(this.ts).format('L LTS');

		if (this.label) {
			title += ` - ${ this.label }`;
		}
		return title;
	},
});

const DEBOUNCE_TIME_FOR_SEARCH_DEPARTMENTS_IN_MS = 300;
Template.customerChatHistory.onCreated(function() {
	const currentData = Template.currentData();
	this.rid = new ReactiveVar(currentData.rid);
	this.filter = new ReactiveVar('');
	this.isKeyUp = new ReactiveVar(false);
	this.hasHistory = new ReactiveVar(false);
	this.isFound = new ReactiveVar();
	this.visitorId = new ReactiveVar();
	this.history = new ReactiveVar([]);
	this.offset = new ReactiveVar(0);
	this.total = new ReactiveVar(0);
	this.isAllChat = new ReactiveVar(true);
	this.isSearching = new ReactiveVar(false);
	this.isChatClicked = new ReactiveVar(true);
	this.clickRid = new ReactiveVar();
	this.clickToken = new ReactiveVar();
	this.autorun(async () => {
		const { room } = await APIClient.v1.get(`rooms.info?roomId=${ currentData.rid }`);
		if (room && room.v) {
			this.visitorId.set(room.v._id);
		}
		this.loadRoom();
	});
	this.loadRoom = async (searchTerm) => {
		if (!this.visitorId.get()) {
			return;
		}
		const offset = this.offset.get();
		let result;
		const closedChatsOnly = true;
		this.searchResult = new ReactiveVar([]);
		const visitorId = this.visitorId.get();
		const rid = this.rid.get();
		let baseUrl = `livechat/visitors.chatHistory/room/${ rid }/visitor/${ visitorId }?count=${ ITEMS_COUNT }&offset=${ offset }&closedChatsOnly=${ closedChatsOnly }`;
		if (searchTerm) {
			baseUrl += `&searchText=${ searchTerm }`;
		}
		const { history, total, resultArray } = await APIClient.v1.get(baseUrl);
		this.total.set(total);
		this.history.set(history);
		if (!this.isKeyUp.get()) {
			if (history.length > 0) {
				this.hasHistory.set(true);
			}
		} else {
			if (searchTerm === '') {
				this.isFound.set(false);
				this.isSearching.set(false);
				return;
			}
			if (resultArray.length !== 0) {
				result = resultArray;
				this.isFound.set(true);
				this.searchResult.set(result);
			}
		}
	};
});

Template.customerChatHistory.events({
	'scroll .visitor-scroll': _.throttle(function(e, instance) {
		if (e.target.scrollTop >= (e.target.scrollHeight - e.target.clientHeight)) {
			const history = instance.history.get();
			if (instance.total.get() <= history.length) {
				return;
			}
			return instance.offset.set(instance.offset.get() + ITEMS_COUNT);
		}
	}, 200),
	'keyup #searchInput': _.debounce((event, template) => {
		event.preventDefault();
		event.stopPropagation();
		template.isSearching.set(true);
		template.isChatClicked.set(false);
		template.isAllChat.set(true);
		template.isFound.set(false);
		template.isKeyUp.set(true);
		template.loadRoom(event.target.value);
	}, DEBOUNCE_TIME_FOR_SEARCH_DEPARTMENTS_IN_MS),
	async 'click .list-chat'(event, template) {
		event.preventDefault();
		template.isAllChat.set(false);
		template.isChatClicked.set(true);
		const { id } = event.currentTarget;
		const token = event.currentTarget.attributes.aria.value;
		template.clickRid.set(id);
		template.clickToken.set(token);
	},

});

Template.customerChatHistory.onDestroyed(function() {
	const header = document.getElementsByClassName('Contextualheading');
	if (header[0]) {
		header[0].innerText = '';
		header[0].className = 'contextual-bar__header-title';
	}
});

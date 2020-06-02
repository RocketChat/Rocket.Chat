import { Template } from 'meteor/templating';
import moment from 'moment';
import { ReactiveVar } from 'meteor/reactive-var';
import './customerChatHistory.html';
import './customerChatRoomHistoryItem.html';
import _ from 'underscore';

import { APIClient } from '../../../../../utils/client';

let roomId;
let roomToken;
const ITEMS_COUNT = 50;
Template.customerChatHistory.helpers({

	hasChatHistory() {
		return Template.instance().hasHistory.get();
	},
	isSearchingRoom() {
		return Template.instance().isSearchingRoom.get();
	},
	isSearching() {
		return Template.instance().isSearching.get();
	},
	isAllChat() {
		return Template.instance().isAllChat.get();
	},
	isChatClicked() {
		return Template.instance().isChatClicked.get();
	},
	isfoundRoom() {
		return Template.instance().isFoundRoom.get();
	},
	isfound() {
		return Template.instance().isFound.get();
	},
	searchResultsRoom() {
		return 	Template.instance().searchResultRoom.get();
	},
	searchResults() {
		return 	Template.instance().searchResult.get();
	},
	previousChats() {
		return Template.instance().history.get();
	},
	clickRid() {
		return roomId;
	},
	clickToken() {
		return roomToken;
	},
	title() {
		let title = moment(this.ts).format('L LTS');

		if (this.label) {
			title += ` - ${ this.label }`;
		}
		return title;
	},
});

const DEBOUNCE_TIME_FOR_SEARCH_CHATS_IN_MS = 300;
Template.customerChatHistory.onCreated(function() {
	const currentData = Template.currentData();
	this.rid = new ReactiveVar(currentData.rid);
	this.isKeyUp = new ReactiveVar(false);
	this.hasHistory = new ReactiveVar(false);
	this.isFoundRoom = new ReactiveVar(false);
	this.isFound = new ReactiveVar(false);
	this.visitorId = new ReactiveVar();
	this.history = new ReactiveVar([]);
	this.offset = new ReactiveVar(0);
	this.total = new ReactiveVar(0);
	this.isAllChat = new ReactiveVar(true);
	this.isSearchingRoom = new ReactiveVar(false);
	this.isSearching = new ReactiveVar(false);
	this.isChatClicked = new ReactiveVar(true);
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
		const closedChatsOnly = true;
		this.searchResultRoom = new ReactiveVar([]);
		this.searchResult = new ReactiveVar([]);
		const visitorId = this.visitorId.get();
		const rid = this.rid.get();
		let baseUrl = `livechat/visitors.chatHistory/room/${ rid }/visitor/${ visitorId }?count=${ ITEMS_COUNT }&offset=${ offset }&closedChatsOnly=${ closedChatsOnly }`;
		if (searchTerm) {
			baseUrl += `&searchText=${ searchTerm }`;
		}
		const { history, total, resultArray, searchResultRooms } = await APIClient.v1.get(baseUrl);
		this.total.set(total);
		this.history.set(history);
		if (!this.isKeyUp.get()) {
			if (history.length > 0) {
				this.hasHistory.set(true);
			}
		} else {
			if (searchTerm === '') {
				if (this.isAllChat.get()) {
					this.isFoundRoom.set(false);
					this.isSearchingRoom.set(false);
				} else {
					this.isFound.set(false);
					this.isSearching.set(false);
				}
				return;
			}
			if (resultArray.length !== 0) {
				if (this.isAllChat.get()) {
					this.isSearchingRoom.set(true);
					this.isFoundRoom.set(true);
					this.searchResultRoom.set(searchResultRooms);
				} else {
					this.isSearching.set(true);
					this.isFound.set(true);
					this.searchResult.set(resultArray);
				}
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
	'keyup #visitor-history-search-input': _.debounce((event, template) => {
		event.preventDefault();
		event.stopPropagation();
		template.isKeyUp.set(true);
		if (template.isAllChat.get()) {
			template.isSearchingRoom.set(true);
			template.isFoundRoom.set(false);
		} else {
			template.isSearching.set(true);
			template.isFound.set(false);
		}
		template.loadRoom(event.target.value);
	}, DEBOUNCE_TIME_FOR_SEARCH_CHATS_IN_MS),
	async 'click .list-chat'(event, template) {
		event.preventDefault();
		template.isAllChat.set(false);
		template.isChatClicked.set(true);
		roomId = event.currentTarget.id;
		roomToken = event.currentTarget.attributes.aria.value;
	},

});

Template.customerChatHistory.onDestroyed(function() {
	const header = document.getElementsByClassName('contextual-heading');
	if (header[0]) {
		header[0].innerText = '';
		header[0].className = 'contextual-bar__header-title';
	}
});

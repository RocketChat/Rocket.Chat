import { Template } from 'meteor/templating';
import moment from 'moment';
import { ReactiveVar } from 'meteor/reactive-var';
import './customerChatHistory.html';
import { APIClient, t } from '../../../../../utils/client';
import { Session } from 'meteor/session';

const ITEMS_COUNT = 50;
let  historyResult 
let len, msgs
let allHistoryChat ;
Template.customerChatHistory.helpers({
	isSearching(){
		return Template.instance().isSearching.get()
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
		return Session.get('found');
	},
	searchResults(){
		// will return search result
		var r = Session.get('searchResult');
		return 	Template.instance().searchResult.get();
	},
	previousChats() {
		// will return pervious chats list
		let history = Template.instance().history.get();
		let newHisTory = []
		for(i=1; i<history.length; i++){
			history[i].time = moment(history[i].ts).format('LT');
			history[i].count = history[i].msgs-3;
			newHisTory.push(history[i]);
		}
		return newHisTory;
	},
	title() {
		
		let title = moment(this.ts).format('L LTS');

		if (this.label) {
			title += ` - ${ this.label }`;
		}
		return title;
	},
});

Template.customerChatHistory.onCreated(function() {
	const currentData = Template.currentData();
	this.visitorId = new ReactiveVar();
	this.history = new ReactiveVar([]);
	this.offset = new ReactiveVar(0);
	this.total = new ReactiveVar(0);
	this.isAllChat = new ReactiveVar(true);
	this.isSearching = new ReactiveVar(false);
	this.isChatClicked = new ReactiveVar(true);
	this.autorun(async () => {
		const { room } = await APIClient.v1.get(`rooms.info?roomId=${ currentData.rid }`);
		if (room && room.v) {
			this.visitorId.set(room.v._id);
		}
	});
	this.autorun(async () => {
		
		if (!this.visitorId.get() || !currentData || !currentData.rid) {
			return;
		}
		const offset = this.offset.get();
		const { history, total } = await APIClient.v1.get(`livechat/visitors.chatHistory/room/${ currentData.rid }/visitor/${ this.visitorId.get() }?count=${ ITEMS_COUNT }&offset=${ offset }`);
		this.total.set(total);
		this.history.set(this.history.get().concat(history));	
	});	
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
	'keyup #searchInput': async function(event,template){ 
		template.isSearching.set(true);
		searchResults = [];
		let text = event.target.value;
		template.isChatClicked.set(false);
		template.isAllChat.set(true);
		Session.set('found',false);
		if(event.target.value == ''){
			template.isSearching.set(false);
		}else{
			
			Template.instance().searchResult = new ReactiveVar([]);
			let history = Template.instance().history.get();
			let array = [];
			for(var j=0; j<history.length; j++){
				var rid = history[j]._id;
				const search  =  await APIClient.v1.get(`chat.search?roomId=${rid}&searchText=${text}`);
				for(k=0; k<search.messages.length; k++){
					search.messages[k].time = moment(search.messages[k].ts).format('LT');
					array.push(search.messages[k]);
				}
			}
			if(array.length >0){
					Session.set('found',true); 
					Session.set('searchResult',array);
					template.searchResult.set(array)
				}	
	}},
	'click .list-chat': async function(event,template){
		event.preventDefault();
		template.isAllChat.set(false);
		template.isChatClicked.set(true);
		let id = event.currentTarget.id
		let token = event.currentTarget.attributes.aria.value;
		Session.set('FetchID',id);
		Session.set('FetchToken',token)
	}

});

Template.customerChatHistory.onDestroyed(function(){
	var header = document.getElementsByClassName('Contextualheading');
	if(header[0]){
		header[0].innerText = ''
		header[0].className = 'contextual-bar__header-title';
	}
})

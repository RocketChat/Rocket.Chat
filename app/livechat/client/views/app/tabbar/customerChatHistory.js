import { Template } from 'meteor/templating';
import moment from 'moment';
import { ReactiveVar } from 'meteor/reactive-var';
import './customerChatHistory.html';
import './chatRoomHistoryItem.html';
import { APIClient, t } from '../../../../../utils/client';
import { Session } from 'meteor/session';
import _ from 'underscore';
const ITEMS_COUNT = 50;
let isChanged;
Template.customerChatHistory.helpers({
	
	hasChatHistory() {
		// will return if user has any chatHistory or not
		return Template.instance().hasHistory.get()
	},
	isSearching() {
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
		return 	Template.instance().searchResult.get();
	},
	previousChats() {
		// will return pervious chats list
		return addTime(Template.instance().history.get(),'true');
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
	isChanged = false;
	const currentData = Template.currentData();
	this.filter = new ReactiveVar('');
	this.hasHistory = new ReactiveVar(false);
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
		const filter = this.filter.get()
		if (!this.visitorId.get() || !currentData || !currentData.rid) {
			return;
		}
		const offset = this.offset.get();
		const searchText='null';
		let baseUrl = `livechat/visitors.chatHistory/room/${ currentData.rid}/visitor/${ this.visitorId.get() }?searchText=${searchText}&count=${ ITEMS_COUNT }&offset=${ offset }`
		const { history, total,resultArray } = await APIClient.v1.get(baseUrl);
		if(history.length > 0){
			for(var i=0 ;i<history.length; i++){
				if(!history[i].open){
					this.hasHistory.set(true);
				}
			}
		}
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
	'keyup #searchInput':  async function(event,template){ 
		const offset = template.offset.get();
		template.isSearching.set(true);
		template.isChatClicked.set(false);
		template.isAllChat.set(true);
		Session.set('found',false);
		if(event.target.value == ''){
			template.isSearching.set(false);
		}else{
				Template.instance().searchResult = new ReactiveVar([]);	
				var result = loadRoom(event.target.value ,Template.currentData().rid,template.visitorId.get(),offset)
				result.then(function(v){
					if(v != null){
					Session.set('found',true); 
					Session.set('searchResult',v);
					template.searchResult.set(v);
					}
				})	
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

loadRoom = async (searchTerm,rid,visitorId,offset) =>{
	let baseUrl = `livechat/visitors.chatHistory/room/${ rid}/visitor/${ visitorId }?searchText=${searchTerm}&count=${ ITEMS_COUNT }&offset=${ offset }`
		const { resultArray } = await APIClient.v1.get(baseUrl);
		if(resultArray.length==0){
			return null;
		}else{
			return  addTime(resultArray);
		}
}

addTime = (array,value='false') => {
	if(value=='true'){
		if(!isChanged){
			array.shift();
			isChanged = true;
		}
	}
	for(var i=0; i<array.length;i++){
			array[i].time = moment(array[i].ts).format('LT');
	};
	return array;
}
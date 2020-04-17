import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import moment from 'moment';
import _ from 'underscore';
import './customerChatHistory.html';
import { APIClient, t } from '../../../../../utils/client';
import { AccountBox, TabBar, MessageTypes } from '../../../../../ui-utils';
import {Mongo ,MongoInternals} from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Session } from 'meteor/session';

const ITEMS_COUNT = 50;
let  historyResult 
let len, msgs
let allHistoryChat ;

Template.customerChatHistory.helpers({
	
	isAllChat:function(){
        // will return is have to load all chat 
		return Template.instance().isAllChat.get();
	},
	isChatClicked:function(){
		// will return that if you have clicked in a single chatHistory
		return Template.instance().isChatClicked.get();
	},
	isfound:function() {
		// will return if find any search result
		var isfound= Session.get('found');
	
		return isfound;
	},
	isLoading() {
		return Template.instance().isLoading.get();
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
			var d = Date.parse(history[i].ts);
			var D = new Date();
			D.setTime(d);
			var newTs = D.toTimeString();
			var time = getTime(newTs);
			history[i].time = time;
			history[i].count = history[i].msgs-3;
			newHisTory.push(history[i]);
		}
		Template.instance().modifiedHistory.set(newHisTory);
		return Template.instance().modifiedHistory.get();
	},
	len(){
		// will return length of total messages in room
		len = Template.instance().historyResu.get();
		return len = len.length-2;
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
	this.isLoading = new ReactiveVar(false);
	this.modifiedHistory = new ReactiveVar([])
	this.history = new ReactiveVar([]);
	this.offset = new ReactiveVar(0);
	this.total = new ReactiveVar(0);
	this.isAllChat = new ReactiveVar(true);
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
	
		this.isLoading.set(true);
		const { history, total } = await APIClient.v1.get(`livechat/visitors.chatHistory/room/${ currentData.rid }/visitor/${ this.visitorId.get() }?count=${ ITEMS_COUNT }&offset=${ offset }`);
		
		this.isLoading.set(false);
		this.total.set(total);
		this.history.set(this.history.get().concat(history));
		// this will load all the chat history chat messages
		allHistoryChat = [];
		var limit = 100;
		let count = this.history.get();
		if(allHistoryChat.length>0){
			return
		}
		for(i=0;i<count.length;i++){
			let id = count[i]._id;
			let token = count[i].v.token;
			setTimeout(async function(){
			const historyResult  =  await APIClient.v1.get(`livechat/messages.history/${ id }?token=${token}&limit=${limit}`);
			let count2 = historyResult.messages;
			
			for(j=0; j<count2.length; j++){

					allHistoryChat.push(count2[j]);
				
			}
			
		},1000)
			
		}
		
	
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
		
		searchResults = [];
		let text = event.target.value;
		template.isChatClicked.set(false);

		Session.set('found',false);
		if(event.target.value == ''){
			template.isAllChat.set(true);
		}else{
			template.isAllChat.set(false);
			Template.instance().searchResult = new ReactiveVar([]);
			
			for(var i=0; i<allHistoryChat.length;i++){
				if(allHistoryChat[i].msg == text){ // check search input matches with any msg
					Session.set('found',true);
					var d = Date.parse(allHistoryChat[i].ts);
					var D = new Date();
					D.setTime(d);
					var newTs = D.toTimeString();
				
					var time = getTime(newTs);
					allHistoryChat[i].time = time;
					searchResults.push(allHistoryChat[i]); 
					Session.set('searchResult',searchResults);
					template.searchResult.set(searchResults)
				
				}
				
			}
			
			if(searchResults.length > 0){
				Session.set('found',true);
			
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
function getTime(newTs){
	var hr = newTs.slice(0,2);
	var min = newTs.slice(3,5);
	if(hr > 12 && hr < 24){
		hr = hr-12;
		return time = `${hr}:${min} PM`;
	}else if(hr == 24){
		hr = 00;
		return time = `${hr}:${min} AM`;
	}else if(hr < 12 ){
		return time = `${hr}:${min} AM`;
	}else if(hr == 12){
		return time = `${hr}:${min} PM`;
	}
}
function getDay(obj){
	var d = Date.parse(obj.ts);
	var D = new Date();
	D.setTime(d);
	var day = D.getDay();
	switch(day){
		case 1 : return 'Monday';
		case 2 : return 'Tuesday';
		case 3 : return 'Wednesday';
		case 4 : return 'Thursday';
		case 5 : return 'Friday';
		case 6 : return 'Saturday';
		case 7 : return 'Sunday';
	}
}
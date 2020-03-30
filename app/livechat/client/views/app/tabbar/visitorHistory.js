import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import moment from 'moment';
import _ from 'underscore';

import './visitorHistory.html';
import './allChatHistory.html';
import { APIClient } from '../../../../../utils/client';
import { AccountBox, TabBar, MessageTypes } from '../../../../../ui-utils';
import {Mongo ,MongoInternals} from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Session } from 'meteor/session';

const ITEMS_COUNT = 50;
let  historyResult 
let len, msgs
let allHistoryChat ;

Template.allChatHistory.helpers({
	
	isAllChat:function(){
        // will return is have to load all chat 
        console.log(Template.instance().isAllChat.get());
		return Template.instance().isAllChat.get();
	},
	isChatClicked:function(){
		// will return that if you have clicked in a single chatHistory
		return Template.instance().isChatClicked.get();
	},
	isfound:function() {
		// will return if find any search result
		var isfound= Session.get('found');
		console.log(isfound)
		return isfound;
	},
	isLoading() {
		return Template.instance().isLoading.get();
	},
	searchResults(){
		// will return search result
		console.log(	Template.instance().searchResult.get())
		return 	Template.instance().searchResult.get();
	},
	previousChats() {
		// will return pervious chats list
		return Template.instance().history.get();
	},
	len(){
		// will return length of total messages in room
		len = Template.instance().historyResu.get();
		return len = len.length-3;
	},
	historyResult(){
		// will return all the messages in history room
		return Template.instance().historyResu.get().reverse();
	},
	time(){
		return 'hyyy';
		console.log(datetime);
	},
	title() {
		
		let title = moment(this.ts).format('L LTS');

		if (this.label) {
			title += ` - ${ this.label }`;
		}
		
		return title;
	},
});

Template.allChatHistory.onCreated(function() {
	const currentData = Template.currentData();
	this.visitorId = new ReactiveVar();
	this.isLoading = new ReactiveVar(false);
	
	this.history = new ReactiveVar([]);
	this.historyResu = new ReactiveVar([]);
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
		console.log('currentData',currentData);
		const offset = this.offset.get();
	
		this.isLoading.set(true);
		const { history, total } = await APIClient.v1.get(`livechat/visitors.chatHistory/room/${ currentData.rid }/visitor/${ this.visitorId.get() }?count=${ ITEMS_COUNT }&offset=${ offset }`);
		
		this.isLoading.set(false);
		this.total.set(total);
		this.history.set(this.history.get().concat(history));
		// this will load all the chat history chat messages
		allHistoryChat = [];
		let count = this.history.get();
		if(allHistoryChat.length>0){
			return
		}
		for(i=0;i<count.length;i++){
			let id = count[i]._id;
			let token = count[i].v.token;
			setTimeout(async function(){
			const historyResult  =  await APIClient.v1.get(`livechat/messages.history/${ id }?token=${token}`);
			let count2 = historyResult.messages;
			for(j=0; j <count2.length; j++){
				
					allHistoryChat.push(count2[j]);
				
				
			}
		},5000)
			
		}
		console.log('allchathistory',allHistoryChat.length+'count',count.length);
		console.log("search result array is",allHistoryChat);
	});	
});

Template.allChatHistory.events({
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
		let text = event.target.value;
		template.isChatClicked.set(false);
		Session.set('found',false);
	
		if(event.target.value == ''){
			template.isAllChat.set(true);
		}else{
			template.isAllChat.set(false);
			Template.instance().searchResult = new ReactiveVar([]);
			searchResults = [];

			for(var i=0; i<allHistoryChat.length;i++){
				if(allHistoryChat[i].msg == text){ // check search input matches with any msg
					Session.set('found',true);
					searchResults.push(allHistoryChat[i]); 
					console.log(allHistoryChat[i]);
				}
				
			}
			template.searchResult.set(searchResults)
			if(searchResults.length > 0){
				Session.set('found',true);
			
			}
		console.log(	Template.instance().searchResult.get());
		console.log(event.target.value);	
	}},
	'click .list-chat': async function(event,template){
		// console.log(TabBar.getButton('visitor-history'));
		template.isAllChat.set(false);
		template.isChatClicked.set(true);
		let id = event.currentTarget.id
		console.log(event);
		let token = event.currentTarget.attributes.aria.value;
		console.log('aria-lable'+token);
				//	let historyArray = template.history.curValue;
	//	console.log(historyArray);
		  historyResult  =  await APIClient.v1.get(`livechat/messages.history/${ id }?token=${token}`);
		  template.historyResu.set(historyResult.messages); 
		// historyResult = JSON.stringify(historyResult.messages);
		   console.log('historyResult:'+JSON.stringify(historyResult.messages));
	
	}

});


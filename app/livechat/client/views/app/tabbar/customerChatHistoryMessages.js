import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import moment from 'moment';
import _ from 'underscore';
import './customerChatHistoryMessages.html';
import { APIClient, t } from '../../../../../utils/client';
import { AccountBox, TabBar, MessageTypes } from '../../../../../ui-utils';
import {Mongo ,MongoInternals} from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Session } from 'meteor/session';

let  historyResult 
let len, msgs
let allHistoryChat ;

Template.customerChatHistoryMessages.helpers({
    
	historyResult(){
		// will return all the messages in history room
		
		return Template.instance().historyResu.get().reverse();
    },
    len(){
		// will return length of total messages in room
		len = Template.instance().historyResu.get();
		return len = len.length-2;
	},
})

Template.customerChatHistoryMessages.onCreated(function() {
    this.historyResu = new ReactiveVar([]);
    var id = Session.get('FetchID');
    var token = Session.get('FetchToken')
    this.autorun(async () => {
    historyResult  =  await APIClient.v1.get(`livechat/messages.history/${ id }?token=${token}`); 
    // will return pervious chats list
        let history = historyResult.messages;
        let newHisTory = []
        for(i=1; i<history.length; i++){
        var d = Date.parse(history[i].ts);
        var D = new Date();
        D.setTime(d);
        var newTs = D.toTimeString();
        var time = getTime(newTs);
        history[i].time = time;
        newHisTory.push(history[i]);
        }
        var header = document.getElementsByClassName('contextual-bar__header-title');
        var day,agentName;

        if(newHisTory.length !== 0){
        var len = newHisTory.length-1;
        agentName = newHisTory[len].u.username;
        day = getDay(newHisTory[len]);
        }
        if(header[0]){
        header[0].innerText= `${agentName}, closed at ${day}`
        header[0].className = 'Contextualheading';
        }

        this.historyResu.set(newHisTory); 
       
    })

})

Template.customerChatHistoryMessages.events({
    
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
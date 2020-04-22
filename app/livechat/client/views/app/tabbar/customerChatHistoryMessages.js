import { Template } from 'meteor/templating';
import moment from 'moment';
import './customerChatHistoryMessages.html';
import { APIClient, t } from '../../../../../utils/client';
import { Session } from 'meteor/session';

let  Messages 
let len, msgs
let allHistoryChat ;

Template.customerChatHistoryMessages.helpers({
	historyResult() {
		// will return all the messages in history room
		return Template.instance().historyResult.get().reverse();
    },
    len() {
		// will return length of total messages in room
		len = Template.instance().historyResult.get();
		return len = len.length-1;
	},
})

Template.customerChatHistoryMessages.onCreated(function() {
    this.historyResult = new ReactiveVar([]);
    var id = Session.get('FetchID');
    var token = Session.get('FetchToken')
    this.autorun(async () => {
		Messages  =  await APIClient.v1.get(`livechat/messages.history/${ id }?token=${token}`); 
    // will return pervious chats list
        let history = Messages.messages;
        let newHisTory = []
        for(i=1; i<history.length; i++){
        history[i].time = moment(history[i].ts).format('LT')
        newHisTory.push(history[i]);
        }
        var header = document.getElementsByClassName('contextual-bar__header-title');
        var day,agentName;

        if(newHisTory.length !== 0){
        var len = newHisTory.length-1;
		agentName = newHisTory[len].u.username;
		day = moment(newHisTory[len].ts).format('dddd'); 
        }
        if(header[0]){
        header[0].innerText= `${agentName}, closed at ${day}`
        header[0].className = 'Contextualheading';
		}
        this.historyResult.set(newHisTory);  
    })
})



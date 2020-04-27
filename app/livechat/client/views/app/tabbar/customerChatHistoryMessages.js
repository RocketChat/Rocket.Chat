import { Template } from 'meteor/templating';
import moment from 'moment';
import './customerChatHistoryMessages.html';
import { APIClient, t } from '../../../../../utils/client';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';

Template.customerChatHistoryMessages.helpers({
	historyResult() {
		// will return all the messages in history room
		return Template.instance().historyResult.get();
    },
    len() {
		// will return length of total messages in room
		let len = Template.instance().historyResult.get();
		return len = len.length;
	},
})
Template.customerChatHistoryMessages.onCreated(function() {
    this.historyResult = new ReactiveVar([]);
    this.history = new ReactiveVar([]);
    var id = Session.get('FetchID');
    var token = Session.get('FetchToken')
    this.autorun(async () => {
		const{ messages }  =  await APIClient.v1.get(`livechat/messages.history/${ id }?token=${token}`); 
    // will return pervious chats list
        this.history.set(messages);
        let allMessages = addTIME(this.history.get());
        var header = document.getElementsByClassName('contextual-bar__header-title');
        var day,agentName;

        if(allMessages.length !== 0){
          var len = allMessages.length-1;
          agentName = allMessages[len].u.username;
          day = moment(allMessages[len].ts).format('dddd'); 
        }
        if(header[0]){
        header[0].innerText= `${agentName}, closed at ${day}`
        header[0].className = 'Contextualheading';
		}
        this.historyResult.set(allMessages);  
    })
})
addTIME = (array) => {
	let newArray = [];
	for(var j=array.length-2; j>=1;j--){
      array[j].time = moment(array[j].ts).format('LT');
      newArray.push(array[j])
  };
  return newArray;
	
}



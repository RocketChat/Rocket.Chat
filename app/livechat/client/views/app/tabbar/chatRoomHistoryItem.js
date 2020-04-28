import moment from 'moment';
import './chatRoomHistoryItem.html';
import { Template } from 'meteor/templating';

Template.chatRoomHistoryItem.onCreated(function() {
	const currentData = Template.currentData();
	currentData.time = moment(currentData.ts).format('LT');
});

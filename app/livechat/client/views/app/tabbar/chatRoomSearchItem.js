import moment from 'moment';
import './chatRoomSearchItem.html';
import { Template } from 'meteor/templating';

Template.chatRoomSearchItem.onCreated(function() {
	const currentData = Template.currentData();
	currentData.time = moment(currentData.ts).format('LT');
});

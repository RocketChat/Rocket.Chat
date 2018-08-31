import {RocketChat} from 'meteor/rocketchat:lib';
import { FlowRouter } from 'meteor/kadira:flow-router';

RocketChat.messageBox.actions.add('Create_new', 'Thread', {
	id: 'start-thread',
	icon: 'thread',
	condition: () => (navigator.getUserMedia || navigator.webkitGetUserMedia) && RocketChat.settings.get('FileUpload_Enabled') && RocketChat.settings.get('Message_VideoRecorderEnabled') && (!RocketChat.settings.get('FileUpload_MediaTypeWhiteList') || RocketChat.settings.get('FileUpload_MediaTypeWhiteList').match(/video\/webm|video\/\*/i)),
	action() {
		return FlowRouter.go('create-thread');
	}
});

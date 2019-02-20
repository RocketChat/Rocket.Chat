import { FlowRouter } from 'meteor/kadira:flow-router';
import { messageBox } from 'meteor/rocketchat:ui-utils';
import { settings } from 'meteor/rocketchat:settings';


messageBox.actions.add('Create_new', 'Thread', {
	id: 'start-thread',
	icon: 'thread',
	condition: () => (navigator.getUserMedia || navigator.webkitGetUserMedia) && settings.get('FileUpload_Enabled') && settings.get('Message_VideoRecorderEnabled') && (!settings.get('FileUpload_MediaTypeWhiteList') || settings.get('FileUpload_MediaTypeWhiteList').match(/video\/webm|video\/\*/i)),
	action() {
		return FlowRouter.go('create-thread');
	},
});

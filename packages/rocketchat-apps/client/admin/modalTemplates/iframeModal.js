import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { modal } from 'meteor/rocketchat:ui-utils';

function iframeMsgListener(e) {
	let data;
	try {
		data = JSON.parse(e.data);
	} catch (e) {
		return;
	}

	if (data.result) {
		modal.close();
		FlowRouter.go(`/admin/apps/${ data.appId }`);
	} else {
		modal.close();
	}
}

Template.iframeModal.onCreated(function() {
	window.addEventListener('message', iframeMsgListener);
});

Template.iframeModal.onDestroyed(function() {
	window.removeEventListener('message', iframeMsgListener);
});

Template.iframeModal.helpers({
	data() {
		return Template.instance().data;
	},
});

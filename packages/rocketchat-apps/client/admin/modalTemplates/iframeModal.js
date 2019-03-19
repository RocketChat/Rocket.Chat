import { Template } from 'meteor/templating';
import { modal } from 'meteor/rocketchat:ui-utils';

function iframeMsgListener(e) {
	let data;
	try {
		data = JSON.parse(e.data);
	} catch (e) {
		return;
	}

	if (data.result) {
		modal.confirm(data);
	} else {
		modal.cancel();
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

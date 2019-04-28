import { Template } from 'meteor/templating';
import { modal } from '../../../../ui-utils';

Template.iframeModal.onCreated(function() {
	const instance = this;

	instance.iframeMsgListener = function _iframeMsgListener(e) {
		let data;
		try {
			data = JSON.parse(e.data);
		} catch (e) {
			return;
		}

		if (data.result) {
			if (typeof instance.data.successCallback === 'function') {
				instance.data.successCallback().then(() => modal.confirm(data));
			} else {
				modal.confirm(data);
			}
		} else {
			modal.cancel();
		}
	};

	window.addEventListener('message', instance.iframeMsgListener);
});

Template.iframeModal.onRendered(function() {
	const iframe = this.firstNode.querySelector('iframe');
	const loading = this.firstNode.querySelector('.loading');
	iframe.addEventListener('load', () => {
		iframe.style.display = 'block';
		loading.style.display = 'none';
	});
});

Template.iframeModal.onDestroyed(function() {
	const instance = this;

	window.removeEventListener('message', instance.iframeMsgListener);
});

Template.iframeModal.helpers({
	data() {
		return Template.instance().data;
	},
});

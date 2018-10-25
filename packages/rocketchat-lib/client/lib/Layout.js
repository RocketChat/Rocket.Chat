import { Tracker } from 'meteor/tracker';
import { FlowRouter } from 'meteor/kadira:flow-router';

RocketChat.Layout = new (class RocketChatLayout {
	constructor() {
		Tracker.autorun(() => {
			this.layout = FlowRouter.getQueryParam('layout');
		});
	}

	isEmbedded() {
		return this.layout === 'embedded';
	}
});

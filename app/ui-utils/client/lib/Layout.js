import { Tracker } from 'meteor/tracker';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

export const Layout = new class RocketChatLayout {
	constructor() {
		Tracker.autorun(() => {
			this.layout = FlowRouter.getQueryParam('layout');
		});
	}

	isEmbedded() {
		return this.layout === 'embedded';
	}
}();

import { Tracker } from 'meteor/tracker';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { ReactiveVar } from 'meteor/reactive-var';

export const Layout = new class RocketChatLayout {
	constructor() {
		this.embedded = new ReactiveVar();
		Tracker.autorun(() => {
			this.layout = FlowRouter.getQueryParam('layout');
			this.embedded.set(this.layout === 'embedded');
		});
	}

	isEmbedded() {
		return this.embedded.get();
	}
}();

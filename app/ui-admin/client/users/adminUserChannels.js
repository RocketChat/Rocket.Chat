import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';

Template.adminUserChannels.helpers({
	type() {
		if (this.t === 'd') {
			return 'at';
		} if (this.t === 'p') {
			return 'lock';
		}
		return 'hash';
	},
	route() {
		switch (this.t) {
			case 'd':
				return FlowRouter.path('direct', {
					username: this.name,
				});
			case 'p':
				return FlowRouter.path('group', {
					name: this.name,
				});
			case 'c':
				return FlowRouter.path('channel', {
					name: this.name,
				});
		}
	},
});

Template.adminUserChannels.helpers({
	type() {
		if (this.t === 'd') {
			return 'at';
		} else if (this.t === 'p') {
			return 'lock';
		} else {
			return 'hash';
		}
	},
	route() {
		switch (this.t) {
			case 'd':
				return FlowRouter.path('direct', {
					username: this.name
				});
			case 'p':
				return FlowRouter.path('group', {
					name: this.name
				});
			case 'c':
				return FlowRouter.path('channel', {
					name: this.name
				});
		}
	}
});

Template.contextualBar.events({
	'click .contextual-bar__header-close'(e, t) {
		t.tabBar.close();
	}
});

Template.contextualBar.onCreated(function() {
	this.tabBar = Template.currentData().tabBar;
});

Template.contextualBar.helpers({
	template() {
		console.log('template', Template.instance().tabBar.getTemplate());
		return Template.instance().tabBar.getTemplate();
	},

	flexData() {
		console.log('data', Object.assign(Template.currentData().data || {}, {
			tabBar: Template.instance().tabBar
		}));
		return Object.assign(Template.currentData().data || {}, {
			tabBar: Template.instance().tabBar
		});
	}
});

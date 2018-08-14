Template.contextualBar.events({
	'click .js-close'(e, t) {
		t.tabBar.close();
	}
});

Template.contextualBar.onCreated(function() {
	this.tabBar = Template.currentData().tabBar;
});

Template.contextualBar.helpers({
	id() {
		return Template.instance().tabBar.getId();
	},
	template() {
		return Template.instance().tabBar.getTemplate();
	},
	headerData() {
		return Template.instance().tabBar.getData();
	},
	flexData() {
		return Object.assign(Template.currentData().data || {}, {
			tabBar: Template.instance().tabBar
		});
	}
});

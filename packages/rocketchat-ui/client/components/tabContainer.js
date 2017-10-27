Template.tabContainer.helpers({
	activeClass(templateName) {
		const instance = Template.instance();
		return instance.activeTemplate.get() === templateName ? 'active' : 'inactive';
	},
	isTabActive(templateName) {
		const instance = Template.instance();
		return instance.activeTemplate.get() === templateName;
	}
});

Template.tabContainer.events({
	'click .rc-tabs__tab-link'(event, instance) {
		event.preventDefault();
		const tmp = event.target.href.split('#');
		instance.activeTemplate.set(tmp[tmp.length - 1]);
	}
});

Template.tabContainer.onCreated(function() {
	this.activeTemplate = new ReactiveVar(this.data.tabs[0].template);
});

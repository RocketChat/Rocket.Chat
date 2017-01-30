Template.flexTabBar.helpers({
	active() {
		if (this.template === Template.instance().tabBar.getTemplate() && Template.instance().tabBar.getState() === 'opened') {
			return 'active';
		}
	},

	buttons() {
		return RocketChat.TabBar.getButtons();
	},

	title() {
		return t(this.i18nTitle) || this.title;
	},

	visible() {
		if (this.groups.indexOf(Template.instance().tabBar.currentGroup()) === -1) {
			return 'hidden';
		}
	},

	opened() {
		return Template.instance().tabBar.getState();
	},

	template() {
		return Template.instance().tabBar.getTemplate();
	},

	flexData() {
		return Object.assign(Template.currentData().data || {}, {
			tabBar: Template.instance().tabBar
		});
	}
});

Template.flexTabBar.events({
	'click .tab-button'(e, instance) {
		e.preventDefault();
		if (instance.tabBar.getState() === 'opened' && instance.tabBar.getTemplate() === this.template) {
			return instance.tabBar.close();
		} else {
			return instance.tabBar.open(this);
		}
	}
});

Template.flexTabBar.onCreated(function() {
	this.tabBar = Template.currentData().tabBar;
});

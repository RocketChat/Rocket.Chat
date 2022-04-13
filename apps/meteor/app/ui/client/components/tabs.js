import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';

import './tabs.html';

Template.tabs.onCreated(function () {
	this.activeTab = new ReactiveVar(this.data.tabs.tabs.find((tab) => tab.active).value);
});

Template.tabs.events({
	'click .tab'(event, instance) {
		const { value } = event.currentTarget.dataset;
		if (value === instance.activeTab.get()) {
			return;
		}
		instance.activeTab.set(value);
		instance.data.tabs.onChange(value);
	},
});

Template.tabs.helpers({
	tabs() {
		return Template.instance().data.tabs.tabs.filter((tab) => (tab.condition ? tab.condition() : tab));
	},
	isActive(value) {
		return Template.instance().activeTab.get() === value;
	},
	ariaSelected(value) {
		return Template.instance().activeTab.get() === value ? { 'aria-selected': 'true' } : {};
	},
});

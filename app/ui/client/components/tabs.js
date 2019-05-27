import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';

Template.tabs.onCreated(function() {
	this.activeTab = new ReactiveVar(this.data.tabs.tabs.find((tab) => tab.active).value);
});

Template.tabs.events({
	'click .tab'(e) {
		const { value } = e.currentTarget.dataset;
		if (value === Template.instance().activeTab.get()) {
			return;
		}
		Template.instance().activeTab.set(value);
		Template.instance().data.tabs.onChange(value);
	},
});

Template.tabs.helpers({
	tabs() {
		return Template.instance().data.tabs.tabs.filter((tab) => (tab.condition ? tab.condition() : tab));
	},
	isActive(value) {
		return Template.instance().activeTab.get() === value;
	},
});

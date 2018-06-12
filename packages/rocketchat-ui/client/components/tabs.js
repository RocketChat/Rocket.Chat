Template.tabs.onRendered(function() {
	this.$('.tab').first().addClass('active');
	this.data.tabs.onChange(this.data.tabs.tabs[0].value);
});

Template.tabs.events({
	'click .tab'(e) {
		$(e.currentTarget).siblings('.tab').removeClass('active');
		$(e.currentTarget).addClass('active');
		Template.instance().data.tabs.onChange($(e.currentTarget).data('value'));
	}
});

Template.tabs.helpers({
	tabs() {
		return Template.instance().data.tabs.tabs.filter(tab => tab.condition ? tab.condition() : tab);
	}
});

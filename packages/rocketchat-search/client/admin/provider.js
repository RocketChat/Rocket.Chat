Template.SearchDefaultProviderAdmin.onCreated(function() {
	this.data.getConfiguration = function(e) {
		return {
			searchAll: e.target.searchAll.checked
		};
	};
});

Template.SearchDefaultProviderAdmin.helpers({
	configuration() {
		return Template.instance().data.configuration;
	}
});

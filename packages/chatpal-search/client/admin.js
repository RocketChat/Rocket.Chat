Template.SearchChatpalProviderAdmin.onCreated(function() {
	this.data.getConfiguration = function(e) {
		return {
			name: e.target.name.value
		};
	};
});

Template.SearchChatpalProviderAdmin.helpers({
	configuration() {
		return Template.instance().data.configuration;
	}
});

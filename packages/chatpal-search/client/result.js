Template.ChatpalSearchResultTemplate.onCreated(function() {

});

Template.ChatpalSearchResultTemplate.helpers({
	result() {console.log(Template.instance().data.result.get())
		return Template.instance().data.result.get();
	}
});

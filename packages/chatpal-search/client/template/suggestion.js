Template.ChatpalSuggestionItemTemplate.onCreated(function() {
	if (this.data.type === 'link') {
		this.data.action = () => {
			alert('Special Action');
		};
	}
});

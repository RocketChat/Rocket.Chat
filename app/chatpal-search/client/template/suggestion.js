import { Template } from 'meteor/templating';

Template.ChatpalSuggestionItemTemplate.onCreated(function () {
	if (this.data.type === 'link') {
		this.data.action = () => {
			console.log('an example for an external link');
		};
	}
});

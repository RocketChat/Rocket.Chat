import toastr from 'toastr';

Template.RocketSearch.onCreated(function() {

	this.loading = new ReactiveVar(false);
	this.result = new ReactiveVar();
	this.resultTemplate = new ReactiveVar();

	Meteor.call('rocketchatSearchResultTemplate', (err, template) => {
		if (err) {
			console.error('Cannot load result template for active search provider');
		} else {
			this.resultTemplate.set(template);
		}
	});

	const search = (text, payload) => {
		this.loading.set(true);

		Meteor.call('rocketchatSearchSearch', text, Session.get('openedRoom'), payload, (err, result) => {
			if (err) {
				toastr.error(TAPi18n.__('SEARCH_MSG_ERROR_SEARCH_FAILED'));
			} else {
				this.result.set({
					result,
					text,
					payload,
					search
				});
			}
			this.loading.set(false);
		});
	};

	this.search = search;

});

Template.RocketSearch.events = {
	'keydown .rocket-searchbox input'(evt, t) {
		if (evt.which === 13) {
			t.search(evt.currentTarget.value);
		}
	}
};

Template.RocketSearch.helpers({
	loading() {
		return Template.instance().loading.get();
	},
	result() {
		return Template.instance().result.get();
	},
	resultTemplate() {
		return Template.instance().resultTemplate.get();
	}
});


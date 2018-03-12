/* globals ReactiveVar, TAPi18n */
import toastr from 'toastr';

Template.RocketSearch.onCreated(function() {

	this.provider = new ReactiveVar();
	this.isActive = new ReactiveVar(false);
	this.error = new ReactiveVar();

	Meteor.call('rocketchatSearch.getProvider', (error, provider) => {
		if (!error && provider) {
			this.scope.settings = provider.settings;
			this.provider.set(provider);
			this.isActive.set(true);
		} else {
			this.error.set('Search_current_provider_not_active');
		}
	});

	this.search = () => {

		const _p = Object.assign({}, this.scope.parentPayload, this.scope.payload);

		if (this.scope.text.get()) {

			this.scope.searching.set(true);

			Meteor.call('rocketchatSearch.search', this.scope.text.get(), {rid:Session.get('openedRoom'), uid:Meteor.userId()}, _p, (err, result) => {
				if (err) {
					toastr.error(TAPi18n.__('Search_message_search_failed'));
					this.scope.searching.set(false);
				} else {
					this.scope.searching.set(false);
					this.scope.result.set(result);
				}
			});
		}
	};

	this.scope = {
		searching: new ReactiveVar(false),
		result: new ReactiveVar(),
		text: new ReactiveVar(),
		settings: {},
		parentPayload: {},
		payload: {},
		search: this.search
	};

});


Template.RocketSearch.events = {
	'keydown #message-search'(evt, t) {
		if (evt.which === 13) {
			evt.preventDefault();
			t.scope.text.set(evt.target.value);
			t.scope.result.set(undefined);
			t.scope.payload = {};
			t.search();
		}
	}
};

Template.RocketSearch.helpers({
	error() {
		return Template.instance().error.get();
	},
	provider() {
		return Template.instance().provider.get();
	},
	scope() {
		return Template.instance().scope;
	},
	text() {
		return Template.instance().scope.text.get();
	},
	isActive() {
		return Template.instance().isActive.get();
	}

});


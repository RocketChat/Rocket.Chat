import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import _ from 'underscore';

import { dispatchToastMessage } from '../../../../client/lib/toast';

Template.RocketSearch.onCreated(function () {
	this.provider = new ReactiveVar();
	this.isActive = new ReactiveVar(false);
	this.error = new ReactiveVar();
	this.suggestions = new ReactiveVar();
	this.suggestionActive = new ReactiveVar();

	Meteor.call('rocketchatSearch.getProvider', (error, provider) => {
		if (!error && provider) {
			this.scope.settings = provider.settings;
			this.provider.set(provider);
			this.isActive.set(true);
		} else {
			this.error.set('Search_current_provider_not_active');
		}
	});

	const _search = () => {
		const _p = Object.assign({}, this.scope.parentPayload, this.scope.payload);

		if (this.scope.text.get()) {
			this.scope.searching.set(true);

			Meteor.call(
				'rocketchatSearch.search',
				this.scope.text.get(),
				{ rid: Session.get('openedRoom'), uid: Meteor.userId() },
				_p,
				(err, result) => {
					if (err) {
						dispatchToastMessage({
							type: 'error',
							message: TAPi18n.__('Search_message_search_failed'),
						});
						this.scope.searching.set(false);
					} else {
						this.scope.searching.set(false);
						this.scope.result.set(result);
					}
				},
			);
		}
	};

	this.scope = {
		searching: new ReactiveVar(false),
		result: new ReactiveVar(),
		text: new ReactiveVar(),
		settings: {},
		parentPayload: {},
		payload: {},
		search: _search,
	};

	this.search = (value) => {
		this.scope.result.set(undefined);
		this.scope.payload = {};
		this.scope.text.set(value);
		_search();
	};

	this.suggest = (value) => {
		this.suggestions.set();

		const _p = Object.assign({}, this.scope.parentPayload, this.scope.payload);

		Meteor.call(
			'rocketchatSearch.suggest',
			value,
			{ rid: Session.get('openedRoom'), uid: Meteor.userId() },
			this.scope.parentPayload,
			_p,
			(err, result) => {
				if (err) {
					// TODO what should happen
				} else {
					this.suggestionActive.set(undefined);
					if (value !== this.scope.text.get()) {
						this.suggestions.set(result);
					}
				}
			},
		);
	};
});

Template.RocketSearch.events = {
	'keydown #message-search'(evt, t) {
		if (evt.keyCode === 13) {
			if (t.suggestionActive.get() !== undefined) {
				const suggestion = t.suggestions.get()[t.suggestionActive.get()];
				if (suggestion.action) {
					const value = suggestion.action();
					if (value) {
						t.search(value);
					}
				} else {
					t.search(suggestion.text);
				}
			} else {
				t.search(evt.target.value.trim());
			}
			t.suggestions.set();
			return evt.preventDefault();
		}

		const suggestions = t.suggestions.get();
		const suggestionActive = t.suggestionActive.get();

		if (evt.keyCode === 40 && suggestions) {
			t.suggestionActive.set(suggestionActive !== undefined && suggestionActive < suggestions.length - 1 ? suggestionActive + 1 : 0);
			return;
		}

		if (evt.keyCode === 38 && suggestions) {
			t.suggestionActive.set(suggestionActive !== undefined && suggestionActive === 0 ? suggestions.length - 1 : suggestionActive - 1);
		}
	},
	'keyup #message-search': _.debounce(function (evt, t) {
		if (evt.keyCode === 13) {
			return evt.preventDefault();
		}

		const { value } = evt.target;

		if (evt.keyCode === 40 || evt.keyCode === 38) {
			return evt.preventDefault();
		}

		if (!t.provider.get().supportsSuggestions) {
			t.search(value);
		} else {
			t.suggest(value);
		}
	}, 300),
	'click .rocket-search-suggestion-item'(e, t) {
		if (this.action) {
			const value = this.action();
			if (value) {
				t.search(value);
			} else {
				t.suggestions.set();
			}
		} else {
			t.search(this.text);
		}
	},
	'mouseenter .rocket-search-suggestion-item'(e, t) {
		t.suggestionActive.set(t.suggestions.get().indexOf(this));
	},
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
	},
	suggestions() {
		return Template.instance().suggestions.get();
	},
	suggestionActive() {
		return Template.instance().suggestionActive.get();
	},
	suggestionSelected(index) {
		return Template.instance().suggestionActive.get() === index ? 'active' : '';
	},
});

// add closer to suggestions
Template.RocketSearch.onRendered(function () {
	$(document).on(`click.suggestionclose.${this.data.rid}`, () => {
		// if (e.target.id !== 'rocket-search-suggestions' && !$(e.target).parents('#rocket-search-suggestions').length) {
		this.suggestions.set();
		// }
	});
	Tracker.autorun((c) => {
		if (this.isActive.get() === true) {
			Tracker.afterFlush(() => {
				document.querySelector('#message-search').focus();
			});
			c.stop();
		}
	});
});

Template.RocketSearch.onDestroyed(function () {
	$(document).off(`click.suggestionclose.${this.data.rid}`);
});

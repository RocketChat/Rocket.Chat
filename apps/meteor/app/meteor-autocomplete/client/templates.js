import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';

import { omit } from '../../../lib/utils/omit';
import AutoComplete from './autocomplete-client';

//  Events on template instances, sent to the autocomplete class
const acEvents = {
	keydown(e, t) {
		t.ac.onKeyDown(e);
	},
	keyup(e, t) {
		t.ac.onKeyUp(e);
	},
	focus(e, t) {
		t.ac.onFocus(e);
	},
	blur(e, t) {
		t.ac.onBlur(e);
	},
};

Template.inputAutocomplete.events(acEvents);

Template.textareaAutocomplete.events(acEvents);

const attributes = function () {
	return omit(this, 'settings'); // Render all but the settings parameter
};

const autocompleteHelpers = {
	attributes,
	autocompleteContainer: new Template('AutocompleteContainer', function () {
		const ac = new AutoComplete(Blaze.getData().settings);
		// Set the autocomplete object on the parent template instance
		this.parentView.templateInstance().ac = ac;

		// Set nodes on render in the autocomplete class
		this.onViewReady(function () {
			ac.element = this.parentView.firstNode();
			ac.$element = $(ac.element);
		});
		return Blaze.With(ac, function() { //eslint-disable-line
			return Template._autocompleteContainer;
		});
	}),
};

Template.inputAutocomplete.helpers(autocompleteHelpers);

Template.textareaAutocomplete.helpers(autocompleteHelpers);

Template._autocompleteContainer.rendered = function () {
	this.data.tmplInst = this;
};

Template._autocompleteContainer.destroyed = function () {
	// Meteor._debug "autocomplete destroyed"
	this.data.teardown();
};

/*
  List rendering helpers
 */

Template._autocompleteContainer.events({
	// t.data is the AutoComplete instance; `this` is the data item
	'click .-autocomplete-item, click [data-autocomplete]'(e, t) {
		t.data.onItemClick(this, e);
	},
	'mouseenter .-autocomplete-item'(e, t) {
		t.data.onItemHover(this, e);
	},
});

Template._autocompleteContainer.helpers({
	empty() {
		return this.filteredList().count() === 0;
	},
	noMatchTemplate() {
		return this.matchedRule().noMatchTemplate || Template._noMatch;
	},
});
export { acEvents, attributes, autocompleteHelpers };

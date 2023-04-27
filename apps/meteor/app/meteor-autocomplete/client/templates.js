import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import $ from 'jquery';

import { omit } from '../../../lib/utils/omit';
import AutoComplete from './autocomplete-client';

Template.inputAutocomplete.events({
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
});

Template.inputAutocomplete.helpers({
	attributes() {
		return omit(this, 'settings'); // Render all but the settings parameter
	},
	autocompleteContainer: new Template('AutocompleteContainer', function () {
		const ac = new AutoComplete(Blaze.getData().settings);
		// Set the autocomplete object on the parent template instance
		this.parentView.templateInstance().ac = ac;

		// Set nodes on render in the autocomplete class
		this.onViewReady(function () {
			ac.element = this.parentView.firstNode();
			ac.$element = $(ac.element);
		});
		// eslint-disable-next-line new-cap
		return Blaze.With(ac, function () {
			//eslint-disable-line
			return Template._autocompleteContainer;
		});
	}),
});

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

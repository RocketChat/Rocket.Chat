import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { Blaze } from 'meteor/blaze';
import { Deps } from 'meteor/deps';
import _ from 'underscore';
import { getCaretCoordinates } from 'meteor/dandv:caret-position';

import AutoCompleteRecords from './collection';
import { APIClient } from '../../utils/client';

const isServerSearch = function (rule) {
	return _.isString(rule.collection);
};

const validateRule = function (rule) {
	if (rule.subscription != null && !Match.test(rule.collection, String)) {
		throw new Error('Collection name must be specified as string for server-side search');
	}
	// XXX back-compat message, to be removed
	if (rule.callback) {
		console.warn('autocomplete no longer supports callbacks; use event listeners instead.');
	}
};

const isWholeField = function (rule) {
	// either '' or null both count as whole field.
	return !rule.token;
};

const getRegExp = function (rule) {
	if (!isWholeField(rule)) {
		// Expressions for the range from the last word break to the current cursor position
		return new RegExp(`(^|\\b|\\s)${rule.token}([\\w.]*)$`);
	}
	// Whole-field behavior - word characters or spaces
	return new RegExp('(^)(.*)$');
};

const getFindParams = function (rule, filter, limit) {
	// This is a different 'filter' - the selector from the settings
	// We need to extend so that we don't copy over rule.filter
	const selector = _.extend({}, rule.filter || {});
	const options = {
		limit,
	};
	if (!filter) {
		// Match anything, no sort, limit X
		return [selector, options];
	}
	if (rule.sort && rule.field) {
		const sortspec = {};
		// Only sort if there is a filter, for faster performance on a match of anything
		sortspec[rule.field] = 1;
		options.sort = sortspec;
	}
	if (_.isFunction(rule.selector)) {
		// Custom selector
		_.extend(selector, rule.selector(filter));
	} else {
		selector[rule.field] = {
			$regex: rule.matchAll ? filter : `^${filter}`,
			// default is case insensitive search - empty string is not the same as undefined!
			$options: typeof rule.options === 'undefined' ? 'i' : rule.options,
		};
	}
	return [selector, options];
};

const getField = function (obj, str) {
	const string = str.split('.');
	string.forEach((key) => {
		obj = obj[key];
	});
	return obj;
};

export default class AutoComplete {
	constructor(settings) {
		this.KEYS = [40, 38, 13, 27, 9];
		this.limit = settings.limit || 5;
		this.position = settings.position || 'bottom';
		this.rules = settings.rules;
		this.selector = {
			container: '.-autocomplete-container',
			item: '.-autocomplete-item',
			...settings.selector,
		};
		const { rules } = this;

		Object.keys(rules).forEach((key) => {
			const rule = rules[key];
			validateRule(rule);
		});

		this.onSelect = settings.onSelect;

		this.expressions = (() =>
			Object.keys(rules).map((key) => {
				const rule = rules[key];
				return getRegExp(rule);
			}))();
		this.matched = -1;
		this.loaded = true;

		// Reactive dependencies for current matching rule and filter
		this.ruleDep = new Deps.Dependency();
		this.filterDep = new Deps.Dependency();
		this.loadingDep = new Deps.Dependency();

		// Autosubscribe to the record set published by the server based on the filter
		// This will tear down server subscriptions when they are no longer being used.
		this.sub = null;
		this.comp = Deps.autorun(async () => {
			const rule = this.matchedRule();
			const filter = this.getFilter();
			if (this.sub) {
				// Stop any existing sub immediately, don't wait
				this.sub.stop();
			}
			if (!(rule && filter)) {
				return;
			}

			// subscribe only for server-side collections
			if (!isServerSearch(rule)) {
				this.setLoaded(true);
				return;
			}
			const [selector] = getFindParams(rule, filter, this.limit);

			// console.debug 'Subscribing to <%s> in <%s>.<%s>', filter, rule.collection, rule.field
			this.setLoaded(false);
			const endpointName = rule.endpoint || 'users.autocomplete';
			const { items } = await APIClient.v1.get(`${endpointName}?selector=${JSON.stringify(selector)}`);
			AutoCompleteRecords.remove({});
			items.forEach((item) => AutoCompleteRecords.insert(item));
			this.setLoaded(true);
		});
	}

	teardown() {
		// Stop the reactive computation we started for this autocomplete instance
		this.comp.stop();
	}

	matchedRule() {
		// reactive getters and setters for @filter and the currently matched rule
		this.ruleDep.depend();
		if (this.matched >= 0) {
			return this.rules[this.matched];
		}
		return null;
	}

	setMatchedRule(i) {
		this.matched = i;
		this.ruleDep.changed();
	}

	getFilter() {
		this.filterDep.depend();
		return this.filter;
	}

	setFilter(x) {
		this.filter = x;
		this.filterDep.changed();
		return this.filter;
	}

	isLoaded() {
		this.loadingDep.depend();
		return this.loaded;
	}

	setLoaded(val) {
		if (val === this.loaded) {
			return; // Don't cause redraws unnecessarily
		}
		this.loaded = val;
		this.loadingDep.changed();
	}

	onKeyUp() {
		if (!this.$element) {
			return; // Don't try to do this while loading
		}

		if (this._timeoutHandler) {
			clearTimeout(this._timeoutHandler);
		}

		this._timeoutHandler = setTimeout(() => {
			this._timeoutHandler = 0;

			const startpos = this.element.selectionStart;
			const val = this.getText().substring(0, startpos);

			/*
				Matching on multiple expressions.
				We always go from a matched state to an unmatched one
				before going to a different matched one.
			 */
			let i = 0;
			let breakLoop = false;
			while (i < this.expressions.length) {
				const matches = val.match(this.expressions[i]);

				// matching -> not matching
				if (!matches && this.matched === i) {
					this.setMatchedRule(-1);
					breakLoop = true;
				}

				// not matching -> matching
				if (matches && this.matched === -1) {
					this.setMatchedRule(i);
					breakLoop = true;
				}

				// Did filter change?
				if (matches && this.filter !== matches[2]) {
					this.setFilter(matches[2]);
					breakLoop = true;
				}
				if (breakLoop) {
					break;
				}
				i++;
			}
		}, 300);
	}

	onKeyDown(e) {
		if (this.matched === -1 || this.KEYS.indexOf(e.keyCode) < 0) {
			return;
		}
		switch (e.keyCode) {
			case 9: // TAB
			case 13: // ENTER
				if (this.select()) {
					// Don't jump fields or submit if select successful
					e.preventDefault();
					e.stopPropagation();
				}
				break;
			// preventDefault needed below to avoid moving cursor when selecting
			case 40: // DOWN
				e.preventDefault();
				this.next();
				break;
			case 38: // UP
				e.preventDefault();
				this.prev();
				break;
			case 27: // ESCAPE
				this.$element.blur();
				this.hideList();
		}
	}

	onFocus() {
		// We need to run onKeyUp after the focus resolves,
		// or the caret position (selectionStart) will not be correct
		Meteor.defer(() => this.onKeyUp());
	}

	onBlur() {
		// We need to delay this so click events work
		// TODO this is a bit of a hack, see if we can't be smarter
		Meteor.setTimeout(() => {
			this.hideList();
		}, 500);
	}

	onItemClick(doc) {
		this.processSelection(doc, this.rules[this.matched]);
	}

	onItemHover(doc, e) {
		this.tmplInst.$(this.selector.item).removeClass('selected');
		$(e.target).closest(this.selector.item).addClass('selected');
	}

	filteredList() {
		// @ruleDep.depend() # optional as long as we use depend on filter, because list will always get re-rendered
		const filter = this.getFilter(); // Reactively depend on the filter
		if (this.matched === -1) {
			return null;
		}
		const rule = this.rules[this.matched];

		// Don't display list unless we have a token or a filter (or both)
		// Single field: nothing displayed until something is typed
		if (!(rule.token || filter)) {
			return null;
		}
		const params = getFindParams(rule, filter, this.limit);
		const selector = params[0];
		const options = params[1];
		Meteor.defer(() => this.ensureSelection());

		// if server collection, the server has already done the filtering work
		if (isServerSearch(rule)) {
			return AutoCompleteRecords.find({}, options);
		}
		// Otherwise, search on client
		return rule.collection.find(selector, options);
	}

	isShowing() {
		const rule = this.matchedRule();
		// Same rules as above
		const showing = rule && (rule.token || this.getFilter());

		// Do this after the render
		if (showing) {
			Meteor.defer(() => {
				this.positionContainer();
				this.ensureSelection();
			});
		}
		return showing;
	}

	// Replace text with currently selected item
	select() {
		const node = this.tmplInst.find(`${this.selector.item}.selected`);
		if (node == null) {
			return false;
		}
		const doc = Blaze.getData(node);
		if (!doc) {
			return false; // Don't select if nothing matched
		}
		this.processSelection(doc, this.rules[this.matched]);
		return true;
	}

	processSelection(doc, rule) {
		const replacement = getField(doc, rule.field);
		if (!isWholeField(rule)) {
			this.replace(replacement, rule);
			this.hideList();
		} else {
			// Empty string or doesn't exist?
			// Single-field replacement: replace whole field
			this.setText(replacement);

			// Field retains focus, but list is hidden unless another key is pressed
			// Must be deferred or onKeyUp will trigger and match again
			// TODO this is a hack; see above
			this.onBlur();
		}
		this.onSelect && this.onSelect(doc);
		this.$element.trigger('autocompleteselect', doc);
	}

	// Replace the appropriate region
	replace(replacement) {
		const startpos = this.element.selectionStart;
		const fullStuff = this.getText();
		let val = fullStuff.substring(0, startpos);
		val = val.replace(this.expressions[this.matched], `$1${this.rules[this.matched].token}${replacement}`);
		const posfix = fullStuff.substring(startpos, fullStuff.length);
		const separator = posfix.match(/^\s/) ? '' : ' ';
		const finalFight = val + separator + posfix;
		this.setText(finalFight);
		const newPosition = val.length + 1;
		this.element.setSelectionRange(newPosition, newPosition);
	}

	hideList() {
		this.setMatchedRule(-1);
		this.setFilter(null);
	}

	getText() {
		return this.$element.val() || this.$element.text();
	}

	setText(text) {
		if (this.$element.is('input,textarea')) {
			return this.$element.val(text);
		}
		this.$element.html(text);
	}

	/*
		Rendering functions
	 */

	positionContainer() {
		// First render; Pick the first item and set css whenever list gets shown
		let pos = {};
		const element = this.selector.anchor ? this.tmplInst.$(this.selector.anchor) : this.$element;

		if (this.position === 'fixed') {
			const width = element.outerWidth();
			return this.tmplInst.$(this.selector.container).css({ width, position: 'fixed' });
		}

		const position = element.position();
		if (!position) {
			return;
		}

		const rule = this.matchedRule();
		const offset = getCaretCoordinates(this.element, this.element.selectionStart);

		// In whole-field positioning, we don't move the container and make it the
		// full width of the field.
		if (rule && isWholeField(rule)) {
			pos.left = position.left;
			if (rule.doNotChangeWidth !== false) {
				pos.width = element.outerWidth(); // position.offsetWidth
			}
		} else {
			// Normal positioning, at token word
			pos = { left: position.left + offset.left };
		}

		// Position menu from top (above) or from bottom of caret (below, default)
		if (this.position === 'top') {
			pos.bottom = element.offsetParent().height() - position.top - offset.top;
		} else {
			pos.top = position.top + offset.top + parseInt(element.css('font-size'));
		}

		this.tmplInst.$(this.selector.container).css({ ...pos, position: 'absolute' });
	}

	ensureSelection() {
		// Re-render; make sure selected item is something in the list or none if list empty
		const selectedItem = this.tmplInst.$(`${this.selector.item}.selected`);
		if (!selectedItem.length) {
			// Select anything
			this.tmplInst.$(`${this.selector.item}:first-child`).addClass('selected');
		}
	}

	// Select next item in list
	next() {
		const currentItem = this.tmplInst.$(`${this.selector.item}.selected`);
		if (!currentItem.length) {
			return this.tmplInst.$(`${this.selector.item}:first-child`).addClass('selected');
		}
		currentItem.removeClass('selected');
		const next = currentItem.next();
		if (next.length) {
			next.addClass('selected');
		} else {
			// End of list or lost selection; Go back to first item
			this.tmplInst.$(`${this.selector.item}:first-child`).addClass('selected');
		}
	}

	// Select previous item in list
	prev() {
		const currentItem = this.tmplInst.$(`${this.selector.item}.selected`);
		if (!currentItem.length) {
			return; // Don't try to iterate an empty list
		}
		currentItem.removeClass('selected');
		const prev = currentItem.prev();
		if (prev.length) {
			prev.addClass('selected');
		} else {
			// Beginning of list or lost selection; Go to end of list
			this.tmplInst.$(`${this.selector.item}:last-child`).addClass('selected');
		}
	}

	// This doesn't need to be reactive because list already changes reactively
	// and will cause all of the items to re-render anyway
	currentTemplate() {
		return this.rules[this.matched].template;
	}
}

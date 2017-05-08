/* globals Deps */
const AutoCompleteRecords = new Mongo.Collection('autocompleteRecords');

const isServerSearch = function(rule) {
	return _.isString(rule.collection);
};

const validateRule = function(rule) {
	if ((rule.subscription != null) && !Match.test(rule.collection, String)) {
		throw new Error('Collection name must be specified as string for server-side search');
	}
	if (rule.callback != null) {
		return console.warn('autocomplete no longer supports callbacks; use event listeners instead.');
	}
};

const isWholeField = function(rule) {
	return !rule.token;
};

const getRegExp = function(rule) {
	if (!isWholeField(rule)) {
		return new RegExp(`(^|\\b|\\s)${ rule.token }([\\w.]*)$`);
	} else {
		return new RegExp('(^)(.*)$');
	}
};

const getFindParams = function(rule, filter, limit) {
	const selector = _.extend({}, rule.filter || {});
	const options = {
		limit
	};
	if (!filter) {
		return [selector, options];
	}
	if (rule.sort && rule.field) {
		const sortspec = {};
		sortspec[rule.field] = 1;
		options.sort = sortspec;
	}
	if (_.isFunction(rule.selector)) {
		_.extend(selector, rule.selector(filter));
	} else {
		selector[rule.field] = {
			$regex: rule.matchAll ? filter : `^${ filter }`,
			$options: typeof rule.options === 'undefined' ? 'i' : rule.options
		};
	}
	return [selector, options];
};

const getField = function(obj, str) {
	const string = str.split('.');
	string.forEach((key) => {
		obj = obj[key];
	});
	return obj;
};

this.AutoComplete = class {

	constructor(settings) {
		this.KEYS = [40, 38, 13, 27, 9];
		this.limit = settings.limit || 5;
		this.position = settings.position || 'bottom';
		this.rules = settings.rules;
		const rules = this.rules;

		Object.keys(rules).forEach((key) => {
			const rule = rules[key];
			validateRule(rule);
		});

		this.expressions = (function() {
			const results = [];
			Object.keys(rules).forEach((key) => {
				const rule = rules[key];
				results.push(getRegExp(rule));
			});
			return results;
		});
		this.matched = -1;
		this.loaded = true;
		this.ruleDep = new Deps.Dependency;
		this.filterDep = new Deps.Dependency;
		this.loadingDep = new Deps.Dependency;
		this.sub = null;
		this.comp = Deps.autorun((function(_this) {
			return function() {
				let filter, options, ref1, ref2, selector, subName;
				if ((ref1 = _this.sub) != null) {
					ref1.stop();
				}
				if (!((rule = _this.matchedRule()) && (filter = _this.getFilter()) !== null)) {
					return;
				}
				if (!isServerSearch(rule)) {
					_this.setLoaded(true);
					return;
				}
				ref2 = getFindParams(rule, filter, _this.limit), selector = ref2[0], options = ref2[1];
				_this.setLoaded(false);
				subName = rule.subscription || 'autocomplete-recordset';
				return _this.sub = Meteor.subscribe(subName, selector, options, rule.collection, function() {
					return _this.setLoaded(true);
				});
			};
		})(this));
	}

	teardown() {
		return this.comp.stop();
	}

	matchedRule() {
		this.ruleDep.depend();
		if (this.matched >= 0) {
			return this.rules[this.matched];
		} else {
			return null;
		}
	}

	setMatchedRule(i) {
		this.matched = i;
		return this.ruleDep.changed();
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
			return;
		}
		this.loaded = val;
		return this.loadingDep.changed();
	}

	onKeyUp() {
		let breakLoop, i, matches, results, startpos, val;
		if (!this.$element) {
			return;
		}
		startpos = this.element.selectionStart;
		val = this.getText().substring(0, startpos);

    /*
      Matching on multiple expressions.
      We always go from a matched state to an unmatched one
      before going to a different matched one.
     */
		i = 0;
		breakLoop = false;
		results = [];
		while (i < this.expressions.length) {
			matches = val.match(this.expressions[i]);
			if (!matches && this.matched === i) {
				this.setMatchedRule(-1);
				breakLoop = true;
			}
			if (matches && this.matched === -1) {
				this.setMatchedRule(i);
				breakLoop = true;
			}
			if (matches && this.filter !== matches[2]) {
				this.setFilter(matches[2]);
				breakLoop = true;
			}
			if (breakLoop) {
				break;
			}
			results.push(i++);
		}
		return results;
	}

	onKeyDown(e) {
		if (this.matched === -1 || (this.constructor.KEYS.indexOf(e.keyCode) < 0)) {
			return;
		}
		switch (e.keyCode) {
			case 9:
			case 13:
				if (this.select()) {
					e.preventDefault();
					e.stopPropagation();
				}
				break;
			case 40:
				e.preventDefault();
				this.next();
				break;
			case 38:
				e.preventDefault();
				this.prev();
				break;
			case 27:
				this.$element.blur();
				this.hideList();
		}
	}

	onFocus() {
		return Meteor.defer((function(_this) {
			return function() {
				return _this.onKeyUp();
			};
		})(this));
	}

	onBlur() {
		return Meteor.setTimeout((function(_this) {
			return function() {
				return _this.hideList();
			};
		}(this)), 500);
	}

	onItemClick(doc, e) {
		return this.processSelection(doc, this.rules[this.matched]);
	}

	onItemHover(doc, e) {
		this.tmplInst.$('.-autocomplete-item').removeClass('selected');
		return $(e.target).closest('.-autocomplete-item').addClass('selected');
	}

	filteredList() {
		let filter, options, ref, rule, selector;
		filter = this.getFilter();
		if (this.matched === -1) {
			return null;
		}
		rule = this.rules[this.matched];
		if (!(rule.token || filter)) {
			return null;
		}
		ref = getFindParams(rule, filter, this.limit), selector = ref[0], options = ref[1];
		Meteor.defer((function(_this) {
			return function() {
				return _this.ensureSelection();
			};
		})(this));
		if (isServerSearch(rule)) {
			return AutoCompleteRecords.find({}, options);
		}
		return rule.collection.find(selector, options);
	}

	isShowing() {
		let rule, showing;
		rule = this.matchedRule();
		showing = (rule != null) && (rule.token || this.getFilter());
		if (showing) {
			Meteor.defer((function(_this) {
				return function() {
					_this.positionContainer();
					return _this.ensureSelection();
				};
			})(this));
		}
		return showing;
	}

	select() {
		let doc, node;
		node = this.tmplInst.find('.-autocomplete-item.selected');
		if (node == null) {
			return false;
		}
		doc = Blaze.getData(node);
		if (!doc) {
			return false;
		}
		this.processSelection(doc, this.rules[this.matched]);
		return true;
	}

	processSelection(doc, rule) {
		let replacement;
		replacement = getField(doc, rule.field);
		if (!isWholeField(rule)) {
			this.replace(replacement, rule);
			this.hideList();
		} else {
			this.setText(replacement);
			this.onBlur();
		}
		this.$element.trigger('autocompleteselect', doc);
	}

	replace(replacement) {
		let finalFight, fullStuff, newPosition, posfix, separator, startpos, val;
		startpos = this.element.selectionStart;
		fullStuff = this.getText();
		val = fullStuff.substring(0, startpos);
		val = val.replace(this.expressions[this.matched], `$1${ this.rules[this.matched].token }${ replacement }`);
		posfix = fullStuff.substring(startpos, fullStuff.length);
		separator = (posfix.match(/^\s/) ? '' : ' ');
		finalFight = val + separator + posfix;
		this.setText(finalFight);
		newPosition = val.length + 1;
		this.element.setSelectionRange(newPosition, newPosition);
	}

	hideList() {
		this.setMatchedRule(-1);
		return this.setFilter(null);
	}

	getText() {
		return this.$element.val() || this.$element.text();
	}

	setText(text) {
		if (this.$element.is('input,textarea')) {
			return this.$element.val(text);
		} else {
			return this.$element.html(text);
		}
	}


  /*
    Rendering functions
   */

	positionContainer() {
		let offset, pos, position, rule;
		position = this.$element.position();
		rule = this.matchedRule();
		offset = getCaretCoordinates(this.element, this.element.selectionStart);
		if ((rule != null) && isWholeField(rule)) {
			pos = {
				left: position.left,
				width: this.$element.outerWidth()
			};
		} else {
			pos = {
				left: position.left + offset.left
			};
		}
		if (this.position === 'top') {
			pos.bottom = this.$element.offsetParent().height() - position.top - offset.top;
		} else {
			pos.top = position.top + offset.top + parseInt(this.$element.css('font-size'));
		}
		return this.tmplInst.$('.-autocomplete-container').css(pos);
	}

	ensureSelection() {
		let selectedItem;
		selectedItem = this.tmplInst.$('.-autocomplete-item.selected');
		if (!selectedItem.length) {
			return this.tmplInst.$('.-autocomplete-item:first-child').addClass('selected');
		}
	}

	next() {
		let currentItem, next;
		currentItem = this.tmplInst.$('.-autocomplete-item.selected');
		if (!currentItem.length) {
			return;
		}
		currentItem.removeClass('selected');
		next = currentItem.next();
		if (next.length) {
			return next.addClass('selected');
		} else {
			return this.tmplInst.$('.-autocomplete-item:first-child').addClass('selected');
		}
	}

	prev() {
		let currentItem, prev;
		currentItem = this.tmplInst.$('.-autocomplete-item.selected');
		if (!currentItem.length) {
			return;
		}
		currentItem.removeClass('selected');
		prev = currentItem.prev();
		if (prev.length) {
			return prev.addClass('selected');
		} else {
			return this.tmplInst.$('.-autocomplete-item:last-child').addClass('selected');
		}
	}

	currentTemplate() {
		return this.rules[this.matched].template;
	}



};

const AutocompleteTest = {
	records: AutoCompleteRecords,
	getRegExp,
	getFindParams
};

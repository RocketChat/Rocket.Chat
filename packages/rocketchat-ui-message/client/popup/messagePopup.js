/* globals toolbarSearch */
// This is not supposed to be a complete list
// it is just to improve readability in this file

import _ from 'underscore';

const keys = {
	TAB: 9,
	ENTER: 13,
	ESC: 27,
	ARROW_LEFT: 37,
	ARROW_UP: 38,
	ARROW_RIGHT: 39,
	ARROW_DOWN: 40
};

function getCursorPosition(input) {
	if (input == null) {
		return;
	}
	if (input.selectionStart != null) {
		return input.selectionStart;
	} else if (document.selection != null) {
		input.focus();
		const sel = document.selection.createRange();
		const selLen = document.selection.createRange().text.length;
		sel.moveStart('character', -input.value.length);
		return sel.text.length - selLen;
	}
}

function setCursorPosition(input, caretPos) {
	if (input == null) {
		return;
	}
	if (input.selectionStart != null) {
		input.focus();
		return input.setSelectionRange(caretPos, caretPos);
	} else if (document.selection != null) {
		const range = input.createTextRange();
		range.move('character', caretPos);
		return range.select();
	}
}

function val(v, d) {
	if (v != null) {
		return v;
	} else {
		return d;
	}
}

Template.messagePopup.onCreated(function() {
	const template = this;
	template.textFilter = new ReactiveVar('');
	template.textFilterDelay = val(template.data.textFilterDelay, 0);
	template.open = val(template.data.open, new ReactiveVar(false));
	template.hasData = new ReactiveVar(false);
	template.value = new ReactiveVar;
	template.trigger = val(template.data.trigger, '');
	template.triggerAnywhere = val(template.data.triggerAnywhere, true);
	template.closeOnEsc = val(template.data.closeOnEsc, true);
	template.blurOnSelectItem = val(template.data.blurOnSelectItem, false);
	template.prefix = val(template.data.prefix, template.trigger);
	template.suffix = val(template.data.suffix, '');
	if (template.triggerAnywhere === true) {
		template.matchSelectorRegex = val(template.data.matchSelectorRegex, new RegExp(`(?:^| |\n)${ template.trigger }[^\\s]*$`));
	} else {
		template.matchSelectorRegex = val(template.data.matchSelectorRegex, new RegExp(`(?:^)${ template.trigger }[^\\s]*$`));
	}
	template.selectorRegex = val(template.data.selectorRegex, new RegExp(`${ template.trigger }([^\\s]*)$`));
	template.replaceRegex = val(template.data.replaceRegex, new RegExp(`${ template.trigger }[^\\s]*$`));
	template.getValue = val(template.data.getValue, function(_id) {
		return _id;
	});
	template.up = () => {
		const current = template.find('.popup-item.selected');
		const previous = $(current).prev('.popup-item')[0] || template.find('.popup-item:last-child');
		if (previous != null) {
			current.className = current.className.replace(/\sselected/, '').replace('sidebar-item__popup-active', '');
			previous.className += ' selected sidebar-item__popup-active';
			return template.value.set(previous.getAttribute('data-id'));
		}
	};
	template.down = () => {
		const current = template.find('.popup-item.selected');
		const next = $(current).next('.popup-item')[0] || template.find('.popup-item');
		if (next && next.classList.contains('popup-item')) {
			current.className = current.className.replace(/\sselected/, '').replace('sidebar-item__popup-active', '');
			next.className += ' selected sidebar-item__popup-active';
			return template.value.set(next.getAttribute('data-id'));
		}
	};
	template.verifySelection = () => {
		const current = template.find('.popup-item.selected');
		if (current == null) {
			const first = template.find('.popup-item');
			if (first != null) {
				first.className += ' selected sidebar-item__popup-active';
				return template.value.set(first.getAttribute('data-id'));
			} else {
				return template.value.set(null);
			}
		}
	};
	template.onInputKeydown = (event) => {
		if (template.open.curValue !== true || template.hasData.curValue !== true) {
			return;
		}
		if (event.which === keys.ENTER || event.which === keys.TAB) {
			if (template.blurOnSelectItem === true) {
				template.input.blur();
			} else {
				template.open.set(false);
			}
			template.enterValue();
			if (template.data.cleanOnEnter) {
				template.input.value = '';
			}
			event.preventDefault();
			event.stopPropagation();
			return;
		}
		if (event.which === keys.ARROW_UP) {
			template.up();
			event.preventDefault();
			event.stopPropagation();
			return;
		}
		if (event.which === keys.ARROW_DOWN) {
			template.down();
			event.preventDefault();
			event.stopPropagation();
		}
	};

	template.setTextFilter = _.debounce(function(value) {
		return template.textFilter.set(value);
	}, template.textFilterDelay);

	template.onInputKeyup = (event) => {
		if (template.closeOnEsc === true && template.open.curValue === true && event.which === keys.ESC) {
			template.open.set(false);
			$('.toolbar').css('display', 'none');
			event.preventDefault();
			event.stopPropagation();
			return;
		}
		const value = template.input.value.substr(0, getCursorPosition(template.input));

		if (template.matchSelectorRegex.test(value)) {
			template.setTextFilter(value.match(template.selectorRegex)[1]);
			template.open.set(true);
		} else {
			template.open.set(false);
		}
		if (template.open.curValue !== true) {
			return;
		}
		if (event.which !== keys.ARROW_UP && event.which !== keys.ARROW_DOWN) {
			return Meteor.defer(function() {
				template.verifySelection();
			});
		}
	};
	template.onFocus = () => {
		template.clickingItem = false;
		if (template.open.curValue === true) {
			return;
		}
		const value = template.input.value.substr(0, getCursorPosition(template.input));
		if (template.matchSelectorRegex.test(value)) {
			template.setTextFilter(value.match(template.selectorRegex)[1]);
			template.open.set(true);
			return Meteor.defer(function() {
				return template.verifySelection();
			});
		} else {
			return template.open.set(false);
		}
	};

	template.onBlur = () => {
		if (template.open.curValue === false) {
			return;
		}
		if (template.clickingItem === true) {
			return;
		}
		return template.open.set(false);
	};

	template.enterValue = function() {
		if (template.value.curValue == null) {
			return;
		}
		const value = template.input.value;
		const caret = getCursorPosition(template.input);
		let firstPartValue = value.substr(0, caret);
		const lastPartValue = value.substr(caret);
		const getValue = this.getValue(template.value.curValue, template.data.collection, template.records.get(), firstPartValue);
		if (!getValue) {
			return;
		}
		firstPartValue = firstPartValue.replace(template.selectorRegex, template.prefix + getValue + template.suffix);
		template.input.value = firstPartValue + lastPartValue;
		return setCursorPosition(template.input, firstPartValue.length);
	};
	template.records = new ReactiveVar([]);
	Tracker.autorun(function() {
		if (template.data.collection.findOne != null) {
			template.data.collection.find().count();
		}
		const filter = template.textFilter.get();
		if (filter != null) {
			const filterCallback = (result) => {
				template.hasData.set(result && result.length > 0);
				template.records.set(result);
				return Meteor.defer(function() {
					return template.verifySelection();
				});
			};
			const result = template.data.getFilter(template.data.collection, filter, filterCallback);
			if (result != null) {
				return filterCallback(result);
			}
		}
	});
});

Template.messagePopup.onRendered(function() {
	if (this.data.getInput != null) {
		this.input = typeof this.data.getInput === 'function' && this.data.getInput();
	} else if (this.data.input) {
		this.input = this.parentTemplate().find(this.data.input);
	}
	if (this.input == null) {
		console.error('Input not found for popup');
	}
	$(this.input).on('keyup', this.onInputKeyup.bind(this));
	$(this.input).on('keydown', this.onInputKeydown.bind(this));
	$(this.input).on('focus', this.onFocus.bind(this));
	return $(this.input).on('blur', this.onBlur.bind(this));
});

Template.messagePopup.onDestroyed(function() {
	$(this.input).off('keyup', this.onInputKeyup);
	$(this.input).off('keydown', this.onInputKeydown);
	$(this.input).off('focus', this.onFocus);
	return $(this.input).off('blur', this.onBlur);
});

Template.messagePopup.events({
	'mouseenter .popup-item'(e) {
		if (e.currentTarget.className.indexOf('selected') > -1) {
			return;
		}
		const template = Template.instance();
		const current = template.find('.popup-item.selected');
		if (current != null) {
			current.className = current.className.replace(/\sselected/, '').replace('sidebar-item__popup-active', '');
		}
		e.currentTarget.className += ' selected sidebar-item__popup-active';
		return template.value.set(this._id);
	},
	'mousedown .popup-item, touchstart .popup-item'() {
		const template = Template.instance();
		return template.clickingItem = true;
	},
	'mouseup .popup-item, touchend .popup-item'() {
		const template = Template.instance();
		template.clickingItem = false;
		template.value.set(this._id);
		template.enterValue();
		template.open.set(false);
		return toolbarSearch.clear();
	}
});

Template.messagePopup.helpers({
	isOpen() {
		return Template.instance().open.get() && ((Template.instance().hasData.get() || (Template.instance().data.emptyTemplate != null)) || !Template.instance().parentTemplate(1).subscriptionsReady());
	},
	data() {
		const template = Template.instance();
		return Object.assign(template.records.get(), {toolbar: true});
	},
	toolbarData() {
		return {...Template.currentData(), toolbar: true};
	},
	sidebarHeaderHeight() {
		return `${ document.querySelector('.sidebar__header').offsetHeight }px`;
	},
	sidebarWidth() {
		return `${ document.querySelector('.sidebar').offsetWidth }px`;
	}
});

/* globals toolbarSearch */
// This is not supposed to be a complete list
// it is just to improve readability in this file
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

Template.messageSuggestionPopup.onCreated(function() {
	const template = this;
	const commandTriggers = 'github';
	//  let commandTriggers = RocketChat.slashcommands.commands.map(c => c.command).join('|');

	template.suggestionCollection = new ReactiveVar([]);
	const config = {
		title: 'Suggestion',
		collection: template.suggestionCollection.get(),
		matchSelectorRegex: new RegExp(`(?:^\/)(${ commandTriggers }) `),
		selectorRegex: new RegExp(`(?:^\/(${ commandTriggers }))\\s*(.*)$`),
		replaceRegex: new RegExp('(\\s+\\w*)$'),
		suffix: ' ',
		triggerAnywhere: false,
		template: 'messagePopupSlashCommand',
		getInput: template.getInput,
		getFilter(collection, filter) {
			if (filter) {
				const params = filter[2].trim().split(' ');
				const command = RocketChat.slashCommands.commands[filter[1]];
				if (params.length === 0 || (params.length === 1 && params[0] === '')) {
					if (command.params) {
						template.suggestionCollection.set(command.params);
					}
				} else {
					params.forEach((value) => {
						const parameterFound = command.params.find((p) => p.value === value);
						if (parameterFound) {
							if ('params' in parameterFound) {
								template.suggestionCollection.set(parameterFound.params);
							} else {
								template.suggestionCollection.set([]);
							}
						}
					});
				/*	const childCommand = template.suggestionCollection.get().find(c => c.value === inputSplit[inputSplit.length - 1]);
					if (childCommand && childCommand.params) {
						const params = childCommand.params[inputSplit.length - 1];
						template.suggestionCollection.set(params.description);
					}
					*/
				}
				//const deep = filter.length - 1;
				//const lastWord = filter[deep];
				//const regExp = new RegExp(`${ RegExp.escape(lastWord) }`, 'i');
				return template.suggestionCollection.get().map((param, index) => {
					const params = typeof(param) === 'string' ? t(param)
						: param.params && param.params.map(p => p.description).join(', ');

					return {
						description: collection[index] ? t(collection[index].description) : '',
						params: params || '',
						_id: typeof(collection[index]) === 'string' ? collection[index] : collection[index].value
					};
				});
			}
		}
	};
	template.title = 'Suggestion';
	template.textFilter = new ReactiveVar('');
	template.textFilterDelay = val(config.textFilterDelay, 0);
	template.open = val(config.open, new ReactiveVar(false));
	template.hasData = new ReactiveVar(false);
	template.value = new ReactiveVar;
	template.triggerAnywhere = false;
	template.closeOnEsc = true;
	template.blurOnSelectItem = val(config.blurOnSelectItem, false);
	template.prefix = val(config.prefix, template.trigger);
	template.suffix = val(config.suffix, '');
	if (template.triggerAnywhere === true) {
		template.matchSelectorRegex = val(config.matchSelectorRegex, new RegExp(`(?:^| )${ template.trigger }[^\\s]*$`));
	} else {
		template.matchSelectorRegex = val(config.matchSelectorRegex, new RegExp(`(?:^)${ template.trigger }[^\\s]*$`));
	}
	template.parameterPrefix = new RegExp('(\\s$)');
	template.selectorRegex = val(config.selectorRegex, new RegExp(`${ template.trigger }([^\\s]*)$`));
	template.replaceRegex = val(config.replaceRegex, new RegExp(`${ template.trigger }[^\\s]*$`));
	template.getValue = val(config.getValue, (_id) => _id);
	template.up = () => {
		const current = template.find('.popup-item.selected');
		const previous = $(current).prev('.popup-item')[0] || template.find('.popup-item:last-child');
		if (previous != null) {
			current.className = current.className.replace(/\sselected/, '');
			previous.className += ' selected';
			return template.value.set(previous.getAttribute('data-id'));
		}
	};
	template.down = () => {
		const current = template.find('.popup-item.selected');
		const next = $(current).next('.popup-item')[0] || template.find('.popup-item');
		if (next && next.classList.contains('popup-item')) {
			current.className = current.className.replace(/\sselected/, '');
			next.className += ' selected';
			return template.value.set(next.getAttribute('data-id'));
		}
	};
	template.verifySelection = () => {
		const current = template.find('.popup-item.selected');
		if (current == null) {
			const first = template.find('.popup-item');
			if (first != null) {
				first.className += ' selected';
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
			if (config.cleanOnEnter) {
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
			event.preventDefault();
			event.stopPropagation();
			return;
		}
		const value = template.input.value.substr(0, getCursorPosition(template.input));

		if (template.open.curValue !== true) {
			return;
		}

		if (template.matchSelectorRegex.test(value)) {
			template.setTextFilter(value.match(template.selectorRegex));
			template.open.set(true);
		} else {
			template.open.set(false);
		}
		/*
    if (template.matchSelectorRegex.test(template.input.value)) {
      const lastParam = template.input.value.match(template.replaceRegex);
      let newSuggestion = template.suggestionCollection.get().find((param) => param.value === lastParam);
      if (newSuggestion && newSuggestion.length > 0) {
        template.suggestionCollection.set(newSuggestion.params || []);
      }
    }
*/
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
			template.setTextFilter(value.match(template.selectorRegex));
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
		const getValue = this.getValue(template.value.curValue, template.suggestionCollection.get(), template.records.get(), firstPartValue);
		if (!getValue) {
			return;
		}
		firstPartValue = firstPartValue.replace(template.replaceRegex, ` ${ getValue }${ template.suffix }`);
		template.input.value = firstPartValue + lastPartValue;
		return setCursorPosition(template.input, firstPartValue.length);
	};
	template.records = new ReactiveVar([]);
	Tracker.autorun(function() {
		if (config.collection.findOne != null) {
			config.collection.find().count();
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
			const result = config.getFilter(template.suggestionCollection.get(), filter, filterCallback);
			if (result != null) {
				return filterCallback(result);
			}
		}
	});
});

Template.messageSuggestionPopup.onRendered(function() {
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

Template.messageSuggestionPopup.onDestroyed(function() {
	$(this.input).off('keyup', this.onInputKeyup);
	$(this.input).off('keydown', this.onInputKeydown);
	$(this.input).off('focus', this.onFocus);
	return $(this.input).off('blur', this.onBlur);
});

Template.messageSuggestionPopup.events({
	'mouseenter .popup-item'(e) {
		if (e.currentTarget.className.indexOf('selected') > -1) {
			return;
		}
		const template = Template.instance();
		const current = template.find('.popup-item.selected');
		if (current != null) {
			current.className = current.className.replace(/\sselected/, '');
		}
		e.currentTarget.className += ' selected';
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

Template.messageSuggestionPopup.helpers({
	isOpen() {
		return Template.instance().open.get() && ((Template.instance().hasData.get() || (Template.instance().data.emptyTemplate != null)) || !Template.instance().parentTemplate(1).subscriptionsReady());
	},
	data() {
		const template = Template.instance();
		return template.records.get();
	}
});

import _ from 'underscore';
import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';

import { slashCommands } from '../../../utils';
import { hasAtLeastOnePermission } from '../../../authorization';
import './messagePopupSlashCommandPreview.html';

const keys = {
	TAB: 9,
	ENTER: 13,
	ESC: 27,
	ARROW_LEFT: 37,
	ARROW_UP: 38,
	ARROW_RIGHT: 39,
	ARROW_DOWN: 40,
};

function getCursorPosition(input) {
	if (!input) {
		return;
	}

	if (input.selectionStart) {
		return input.selectionStart;
	}
	if (document.selection) {
		input.focus();
		const sel = document.selection.createRange();
		const selLen = document.selection.createRange().text.length;
		sel.moveStart('character', -input.value.length);
		return sel.text.length - selLen;
	}
}

Template.messagePopupSlashCommandPreview.onCreated(function () {
	this.open = new ReactiveVar(false);
	this.isLoading = new ReactiveVar(true);
	this.preview = new ReactiveVar();
	this.selectedItem = new ReactiveVar();
	this.commandName = new ReactiveVar('');
	this.commandArgs = new ReactiveVar('');

	// regex ensures a command is entered into the input
	// such as "/testing " before continuing
	this.matchSelectorRegex = /(?:^)(\/[\w\d\S]+ )[^]*$/;
	this.selectorRegex = /(\/[\w\d\S]+ )([^]*)$/;
	this.replaceRegex = /(\/[\w\d\S]+ )[^]*$/; // WHAT'S THIS

	this.dragging = false;

	const template = this;
	template.fetchPreviews = _.debounce(function _previewFetcher(cmd, args) {
		const command = cmd;
		const params = args;
		const { rid, tmid } = template.data;
		Meteor.call('getSlashCommandPreviews', { cmd, params, msg: { rid, tmid } }, function (err, preview) {
			if (err) {
				return;
			}

			if (!preview || !Array.isArray(preview.items)) {
				template.preview.set({
					i18nTitle: 'No_results_found_for',
					items: [],
				});
			} else {
				template.preview.set(preview);
			}

			template.commandName.set(command);
			template.commandArgs.set(params);
			template.isLoading.set(false);

			Meteor.defer(function () {
				template.verifySelection();
			});
		});
	}, 500);

	template.enterKeyAction = () => {
		const current = template.find('.popup-item.selected');

		if (!current) {
			return;
		}

		const selectedId = current.getAttribute('data-id');

		if (!selectedId) {
			return;
		}

		const cmd = template.commandName.curValue;
		const params = template.commandArgs.curValue;

		if (!cmd || !params) {
			return;
		}

		const item = template.preview.curValue.items.find((i) => i.id === selectedId);

		if (!item) {
			return;
		}

		const { rid, tmid } = template.data;
		Meteor.call('executeSlashCommandPreview', { cmd, params, msg: { rid, tmid } }, item, function (err) {
			if (err) {
				console.warn(err);
			}
		});

		template.open.set(false);
		template.inputBox.value = '';
		template.preview.set();
		template.commandName.set('');
		template.commandArgs.set('');
	};

	template.selectionLogic = () => {
		const inputValueAtCursor = template.inputBox.value.substr(0, getCursorPosition(template.inputBox));

		if (!template.matchSelectorRegex.test(inputValueAtCursor)) {
			template.open.set(false);
			return;
		}

		const matches = inputValueAtCursor.match(template.selectorRegex);
		const cmd = matches[1].replace('/', '').trim().toLowerCase();
		const command = slashCommands.commands[cmd];

		// Ensure the command they're typing actually exists
		// And it provides a command preview
		// And if it provides a permission to check, they have permission to run the command
		const { rid } = template.data;
		if (!command || !command.providesPreview || (command.permission && !hasAtLeastOnePermission(command.permission, rid))) {
			template.open.set(false);
			return;
		}

		const args = matches[2];

		// Check to verify there are no additional arguments passed,
		// Because we we don't care about what it if there isn't
		if (!args) {
			template.open.set(false);
			return;
		}

		// If they haven't changed a thing, show what we already got
		if (template.commandName.curValue === cmd && template.commandArgs.curValue === args && template.preview.curValue) {
			template.isLoading.set(false);
			template.open.set(true);
			return;
		}

		template.isLoading.set(true);
		template.open.set(true);

		// Fetch and display them
		template.fetchPreviews(cmd, args);
	};

	template.verifySelection = () => {
		const current = template.find('.popup-item.selected');

		if (!current) {
			const first = template.find('.popup-item');

			if (first) {
				first.className += ' selected sidebar-item__popup-active';
			}
		}
	};

	// Typing data
	template.onInputKeyup = (event) => {
		if (template.open.curValue === true && event.which === keys.ESC) {
			template.open.set(false);
			event.preventDefault();
			event.stopPropagation();
			return;
		}

		if (event.which === keys.ARROW_UP || event.which === keys.ARROW_DOWN) {
			// Arrow up and down are for navigating the choices
			return;
		}

		template.selectionLogic();
	};

	// Using the keyboard to navigate the options
	template.onInputKeydown = (event) => {
		if (!template.open.curValue || template.isLoading.curValue) {
			return;
		}

		if (event.which === keys.ENTER) {
			// || event.which === keys.TAB) { <-- does using tab to select make sense?
			template.enterKeyAction();
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

	template.up = () => {
		const current = template.find('.popup-item.selected');
		const previous = $(current).prev('.popup-item')[0] || template.find('.popup-item:last-child');

		if (previous != null) {
			current.className = current.className.replace(/\sselected/, '').replace('sidebar-item__popup-active', '');
			previous.className += ' selected sidebar-item__popup-active';
		}
	};

	template.down = () => {
		const current = template.find('.popup-item.selected');
		const next = $(current).next('.popup-item')[0] || template.find('.popup-item');

		if (next && next.classList.contains('popup-item')) {
			current.className = current.className.replace(/\sselected/, '').replace('sidebar-item__popup-active', '');
			next.className += ' selected sidebar-item__popup-active';
		}
	};

	template.onFocus = () => {
		template.clickingItem = false;
		if (template.open.curValue) {
			return;
		}

		template.selectionLogic();
	};

	template.onBlur = () => {
		if (template.clickingItem) {
			return;
		}

		return template.open.set(false);
	};
});

Template.messagePopupSlashCommandPreview.onRendered(function _messagePopupSlashCommandPreviewRendered() {
	if (!this.data.getInput) {
		throw Error('Somethign wrong happened.');
	}

	this.inputBox = this.data.getInput();
	$(this.inputBox).on('keyup', this.onInputKeyup.bind(this));
	$(this.inputBox).on('keydown', this.onInputKeydown.bind(this));
	$(this.inputBox).on('focus', this.onFocus.bind(this));
	$(this.inputBox).on('blur', this.onBlur.bind(this));

	const self = this;
	self.autorun(() => {
		setTimeout(self.selectionLogic, 500);
	});
});

Template.messagePopupSlashCommandPreview.onDestroyed(function () {
	$(this.inputBox).off('keyup', this.onInputKeyup);
	$(this.inputBox).off('keydown', this.onInputKeydown);
	$(this.inputBox).off('focus', this.onFocus);
	$(this.inputBox).off('blur', this.onBlur);
});

Template.messagePopupSlashCommandPreview.events({
	'mouseenter .popup-item, mousedown .popup-item, touchstart .popup-item'(e) {
		if (e.currentTarget.className.includes('selected')) {
			return;
		}

		const template = Template.instance();
		const current = template.find('.popup-item.selected');
		if (current) {
			current.className = current.className.replace(/\sselected/, '').replace('sidebar-item__popup-active', '');
		}

		e.currentTarget.className += ' selected sidebar-item__popup-active';
	},
	'mousedown .popup-item, touchstart .popup-item'() {
		const template = Template.instance();
		template.clickingItem = true;
	},
	'mouseup .popup-item, touchend .popup-item'() {
		const template = Template.instance();
		if (template.dragging) {
			template.dragging = false;
			return;
		}

		template.clickingItem = false;
		template.enterKeyAction();
	},
	'touchmove .popup-item'(e) {
		e.stopPropagation();
		const template = Template.instance();
		template.dragging = true;
	},
});

Template.messagePopupSlashCommandPreview.helpers({
	isOpen() {
		return Template.instance().open.get(); // && ((Template.instance().hasData.get() || (Template.instance().data.emptyTemplate != null)) || !Template.instance().parentTemplate(1).subscriptionsReady());
	},
	getArgs() {
		return Template.instance().commandArgs.get();
	},
	isLoading() {
		return Template.instance().isLoading.get();
	},
	isType(actual, expected) {
		return actual === expected;
	},
	preview() {
		return Template.instance().preview.get();
	},
});

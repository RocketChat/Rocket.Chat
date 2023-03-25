import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import type { SlashCommandPreviews } from '@rocket.chat/core-typings';

import { slashCommands } from '../../../utils/client';
import { hasAtLeastOnePermission } from '../../../authorization/client';
import { withDebouncing } from '../../../../lib/utils/highOrderFunctions';

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

const getCursorPosition = (input: HTMLInputElement | HTMLTextAreaElement | null | undefined): number | undefined => {
	return input?.selectionStart ?? undefined;
};

Template.messagePopupSlashCommandPreview.onCreated(function () {
	this.open = new ReactiveVar(false);
	this.isLoading = new ReactiveVar(true);
	this.preview = new ReactiveVar<SlashCommandPreviews | undefined>(undefined);
	this.selectedItem = new ReactiveVar(undefined);
	this.commandName = new ReactiveVar('');
	this.commandArgs = new ReactiveVar('');

	// regex ensures a command is entered into the input
	// such as "/testing " before continuing
	this.matchSelectorRegex = /(?:^)(\/[\w\d\S]+ )[^]*$/;
	this.selectorRegex = /(\/[\w\d\S]+ )([^]*)$/;
	this.replaceRegex = /(\/[\w\d\S]+ )[^]*$/; // WHAT'S THIS

	this.dragging = false;

	this.fetchPreviews = withDebouncing({ wait: 500 })((cmd, args) => {
		const command = cmd;
		const params = args;
		const { rid, tmid } = this.data;
		Meteor.call(
			'getSlashCommandPreviews',
			{ cmd, params, msg: { rid, tmid } },
			(err: Meteor.Error | Meteor.TypedError | Error | null | undefined, preview?: SlashCommandPreviews) => {
				if (err) {
					return;
				}

				if (!preview || !Array.isArray(preview.items)) {
					this.preview.set({
						i18nTitle: 'No_results_found_for',
						items: [],
					});
				} else {
					this.preview.set(preview);
				}

				this.commandName.set(command);
				this.commandArgs.set(params);
				this.isLoading.set(false);

				Meteor.defer(() => {
					this.verifySelection();
				});
			},
		);
	});

	this.enterKeyAction = () => {
		const current = this.find('.popup-item.selected');

		if (!current) {
			return;
		}

		const selectedId = current.getAttribute('data-id');

		if (!selectedId) {
			return;
		}

		const cmd = Tracker.nonreactive(() => this.commandName.get());
		const params = Tracker.nonreactive(() => this.commandArgs.get());

		if (!cmd || !params) {
			return;
		}

		const item = Tracker.nonreactive(() => this.preview.get())?.items.find((i) => i.id === selectedId);

		if (!item) {
			return;
		}

		const { rid, tmid } = this.data;
		Meteor.call(
			'executeSlashCommandPreview',
			{ cmd, params, msg: { rid, tmid } },
			item,
			(err: Meteor.Error | Meteor.TypedError | Error | null | undefined) => {
				if (err) {
					console.warn(err);
				}
			},
		);

		this.open.set(false);
		if (this.inputBox) this.inputBox.value = '';
		this.preview.set(undefined);
		this.commandName.set('');
		this.commandArgs.set('');
	};

	this.selectionLogic = () => {
		const inputValueAtCursor = this.inputBox?.value.slice(0, getCursorPosition(this.inputBox)) ?? '';

		if (!this.matchSelectorRegex.test(inputValueAtCursor)) {
			this.open.set(false);
			return;
		}

		const matches = inputValueAtCursor.match(this.selectorRegex);

		if (!matches) {
			this.open.set(false);
			return;
		}

		const cmd = matches[1].replace('/', '').trim().toLowerCase();
		const command = slashCommands.commands[cmd];

		// Ensure the command they're typing actually exists
		// And it provides a command preview
		// And if it provides a permission to check, they have permission to run the command
		const { rid } = this.data;
		if (!command?.providesPreview || (command.permission && !hasAtLeastOnePermission(command.permission, rid))) {
			this.open.set(false);
			return;
		}

		const args = matches[2];

		// Check to verify there are no additional arguments passed,
		// Because we we don't care about what it if there isn't
		if (!args) {
			this.open.set(false);
			return;
		}

		// If they haven't changed a thing, show what we already got
		if (
			Tracker.nonreactive(() => this.commandName.get()) === cmd &&
			Tracker.nonreactive(() => this.commandArgs.get()) === args &&
			Tracker.nonreactive(() => this.preview.get())
		) {
			this.isLoading.set(false);
			this.open.set(true);
			return;
		}

		this.isLoading.set(true);
		this.open.set(true);

		// Fetch and display them
		this.fetchPreviews(cmd, args);
	};

	this.verifySelection = () => {
		const current = this.find('.popup-item.selected');

		if (!current) {
			const first = this.find('.popup-item');

			if (first) {
				first.className += ' selected sidebar-item__popup-active';
			}
		}
	};

	// Typing data
	this.onInputKeyup = (event) => {
		if (Tracker.nonreactive(() => this.open.get()) === true && event.which === keys.ESC) {
			this.open.set(false);
			event.preventDefault();
			event.stopPropagation();
			return;
		}

		if (event.which === keys.ARROW_UP || event.which === keys.ARROW_DOWN) {
			// Arrow up and down are for navigating the choices
			return;
		}

		this.selectionLogic();
	};

	// Using the keyboard to navigate the options
	this.onInputKeydown = (event) => {
		if (!Tracker.nonreactive(() => this.open.get()) || Tracker.nonreactive(() => this.isLoading.get())) {
			return;
		}

		if (event.which === keys.ENTER) {
			// || event.which === keys.TAB) { <-- does using tab to select make sense?
			this.enterKeyAction();
			event.preventDefault();
			event.stopPropagation();
			return;
		}

		if (event.which === keys.ARROW_UP) {
			this.up();
			event.preventDefault();
			event.stopPropagation();
			return;
		}

		if (event.which === keys.ARROW_DOWN) {
			this.down();
			event.preventDefault();
			event.stopPropagation();
		}
	};

	this.up = () => {
		const current = this.find('.popup-item.selected');
		const previous = $(current).prev('.popup-item')[0] || this.find('.popup-item:last-child');

		if (previous) {
			current.className = current.className.replace(/\sselected/, '').replace('sidebar-item__popup-active', '');
			previous.className += ' selected sidebar-item__popup-active';
		}
	};

	this.down = () => {
		const current = this.find('.popup-item.selected');
		const next = $(current).next('.popup-item')[0] || this.find('.popup-item');

		if (next?.classList.contains('popup-item')) {
			current.className = current.className.replace(/\sselected/, '').replace('sidebar-item__popup-active', '');
			next.className += ' selected sidebar-item__popup-active';
		}
	};

	this.onFocus = () => {
		this.clickingItem = false;
		if (Tracker.nonreactive(() => this.open.get())) {
			return;
		}

		this.selectionLogic();
	};

	this.onBlur = () => {
		if (this.clickingItem) {
			return;
		}

		return this.open.set(false);
	};
});

Template.messagePopupSlashCommandPreview.onRendered(function _messagePopupSlashCommandPreviewRendered() {
	if (!this.data.getInput) {
		throw Error('Somethign wrong happened.');
	}

	this.inputBox = this.data.getInput();

	if (!this.inputBox) {
		throw Error('Somethign wrong happened.');
	}

	$(this.inputBox).on('keyup', this.onInputKeyup);
	$(this.inputBox).on('keydown', this.onInputKeydown);
	$(this.inputBox).on('focus', this.onFocus);
	$(this.inputBox).on('blur', this.onBlur);

	this.autorun(() => {
		setTimeout(this.selectionLogic, 500);
	});
});

Template.messagePopupSlashCommandPreview.onDestroyed(function () {
	if (!this.inputBox) {
		throw Error('Somethign wrong happened.');
	}

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

		const template = Template.instance<'messagePopupSlashCommandPreview'>();
		const current = template.find('.popup-item.selected');
		if (current) {
			current.className = current.className.replace(/\sselected/, '').replace('sidebar-item__popup-active', '');
		}

		e.currentTarget.className += ' selected sidebar-item__popup-active';
	},
	'mousedown .popup-item, touchstart .popup-item'() {
		const template = Template.instance<'messagePopupSlashCommandPreview'>();
		template.clickingItem = true;
	},
	'mouseup .popup-item, touchend .popup-item'() {
		const template = Template.instance<'messagePopupSlashCommandPreview'>();
		if (template.dragging) {
			template.dragging = false;
			return;
		}

		template.clickingItem = false;
		template.enterKeyAction();
	},
	'touchmove .popup-item'(e) {
		e.stopPropagation();
		const template = Template.instance<'messagePopupSlashCommandPreview'>();
		template.dragging = true;
	},
});

Template.messagePopupSlashCommandPreview.helpers({
	isOpen() {
		return Template.instance<'messagePopupSlashCommandPreview'>().open.get();
	},
	getArgs() {
		return Template.instance<'messagePopupSlashCommandPreview'>().commandArgs.get();
	},
	isLoading() {
		return Template.instance<'messagePopupSlashCommandPreview'>().isLoading.get();
	},
	isType(actual: unknown, expected: unknown) {
		return actual === expected;
	},
	preview() {
		return Template.instance<'messagePopupSlashCommandPreview'>().preview.get();
	},
});

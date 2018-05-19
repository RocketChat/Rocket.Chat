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
	if (!input) {
		return;
	}

	if (input.selectionStart) {
		return input.selectionStart;
	} else if (document.selection) {
		input.focus();
		const sel = document.selection.createRange();
		const selLen = document.selection.createRange().text.length;
		sel.moveStart('character', -input.value.length);
		return sel.text.length - selLen;
	}
}

Template.messagePopupSlashCommandPreview.onCreated(function() {
	this.open = new ReactiveVar(false);
	this.isLoading = new ReactiveVar(true);
	this.preview = new ReactiveVar();
	this.selectedItem = new ReactiveVar();
	this.commandArgs = new ReactiveVar('');

	// regex ensures a command is entered into the input
	// such as "/testing " before continuing
	this.matchSelectorRegex = /(?:^)(\/[\w\d\S]+ )[^]*$/;
	this.selectorRegex = /(\/[\w\d\S]+ )([^]*)$/;
	this.replaceRegex = /(\/[\w\d\S]+ )[^]*$/; // WHAT'S THIS

	const template = this;
	template.fetchPreviews = _.debounce(function _previewFetcher(cmd, args) {
		const params = args;
		Meteor.call('getSlashCommandPreviews', { cmd, params, msg: { rid: Session.get('openedRoom') } }, function(err, preview) {
			if (err) {
				return;
			}

			template.preview.set(preview);
			template.commandArgs.set(params);
			template.isLoading.set(false);
		});
	}, 500);

	template.onInputKeyup = (event) => {
		if (template.open.curValue === true && event.which === keys.ESC) {
			template.open.set(false);
			$('.toolbar').css('display', 'none'); // TODO will it be a different class?
			event.preventDefault();
			event.stopPropagation();
			return;
		}

		const inputValueAtCursor = template.inputBox.value.substr(0, getCursorPosition(template.inputBox));

		if (!template.matchSelectorRegex.test(inputValueAtCursor)) {
			template.open.set(false);
			return;
		}

		const matches = inputValueAtCursor.match(template.selectorRegex);
		const cmd = matches[1].replace('/', '').trim().toLowerCase();
		const command = RocketChat.slashCommands.commands[cmd];

		// Ensure the command they're typing actually exists
		// And it provides a command preview
		// And if it provides a permission to check, they have permission to run the command
		if (!command || !command.providesPreview || (command.permission && !RocketChat.authz.hasAtLeastOnePermission(command.permission, Session.get('openedRoom')))) {
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

		template.isLoading.set(true);
		template.open.set(true);

		// Fetch and display them
		template.fetchPreviews(cmd, args);

		// TODO: Evaluate this
		// if (event.which !== keys.ARROW_UP && event.which !== keys.ARROW_DOWN) {
		// 	return Meteor.defer(function() {
		// 		template.verifySelection();
		// 	});
		// }
	};

	console.log('hello and here be the template', template);
});

Template.messagePopupSlashCommandPreview.onRendered(function _messagePopupSlashCommandPreviewRendered() {
	if (!this.data.getInput) {
		throw Error('Somethign wrong happened.');
	}

	this.inputBox = this.data.getInput();
	$(this.inputBox).on('keyup', this.onInputKeyup.bind(this));
});

Template.messagePopupSlashCommandPreview.onDestroyed(function() {
	$(this.input).off('keyup', this.onInputKeyup);
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
	}
});

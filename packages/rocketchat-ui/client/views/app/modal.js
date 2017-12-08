/* globals modal */

this.modal = {
	renderedModal: null,
	open(config = {}, fn) {
		config.confirmButtonText = config.confirmButtonText || t('Send');
		config.cancelButtonText = config.cancelButtonText || t('Cancel');

		if (config.type === 'input') {
			config.input = true;
			config.type = false;

			if (!config.inputType) {
				config.inputType = 'text';
			}
		}

		this.close();
		this.renderedModal = Blaze.renderWithData(Template.rc_modal, config, document.body);
		this.fn = fn;
		this.config = config;
		this.timer = null;
		if (config.timer) {
			this.timer = setTimeout(() => this.close(), config.timer);
		}
	},
	close() {
		if (this.renderedModal) {
			Blaze.remove(this.renderedModal);
		}
		this.fn = null;
		if (this.timer) {
			clearTimeout(this.timer);
		}
	},
	confirm(value) {
		if (this.fn) {
			this.fn(value);
		} else {
			this.close();
		}

		this.config.closeOnConfirm && this.close();
	},
	showInputError(text) {
		const errorEl = document.querySelector('.rc-modal__content-error');
		errorEl.innerHTML = text;
		errorEl.style.display = 'block';
	}
};

Template.rc_modal.helpers({
	hasAction() {
		return !!this.action;
	},
	modalIcon() {
		return `modal-${ this.type }`;
	}
});

Template.rc_modal.onRendered(function() {
	if (this.data.onRendered) {
		this.data.onRendered();
	}
});

Template.rc_modal.events({
	'click .js-action'(e, instance) {
		!this.action || this.action.call(instance.data.data, e, instance);
		modal.close();
	},
	'click .js-close'() {
		modal.close();
	},
	'click .js-confirm'(e, instance) {
		if (instance.data.input) {
			return modal.confirm($('.js-modal-input').val());
		}

		modal.confirm(true);
	},
	'click .rc-modal-wrapper'(e, instance) {
		if (instance.data.allowOutsideClick === false) {
			return false;
		}

		if (e.currentTarget === e.target) {
			modal.close();
		}
	}
});

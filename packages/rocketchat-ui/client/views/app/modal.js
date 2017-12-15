/* globals modal */

this.modal = {
	renderedModal: null,
	open(config = {}, fn) {
		config.confirmButtonText = config.confirmButtonText || t('Send');
		config.cancelButtonText = config.cancelButtonText || t('Cancel');
		config.closeOnConfirm = config.closeOnConfirm == null ? true : config.closeOnConfirm;
		config.showConfirmButton = config.showConfirmButton == null ? true : config.showConfirmButton;
		config.showFooter = config.showConfirmButton === true || config.showCancelButton === true;

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
	},
	onKeydown(e) {
		e.preventDefault();
		e.stopPropagation();

		if (e.key === 'Enter') {
			modal.confirm(true);
		}

		if (e.key === 'Escape') {
			modal.close();
		}
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

	document.addEventListener('keydown', modal.onKeydown);
});

Template.rc_modal.onDestroyed(function() {
	document.removeEventListener('keydown', modal.onKeydown);
});

Template.rc_modal.events({
	'click .js-action'(e, instance) {
		!this.action || this.action.call(instance.data.data, e, instance);
		e.stopPropagation();
		modal.close();
	},
	'click .js-close'(e) {
		e.stopPropagation();
		modal.close();
	},
	'click .js-confirm'(e, instance) {
		e.stopPropagation();
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
			e.stopPropagation();
			modal.close();
		}
	}
});

import './modal.html';
import { Meteor } from 'meteor/meteor';
import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import { t, getUserPreference, handleError } from '/app/utils';

export const modal = {
	renderedModal: null,
	open(config = {}, fn, onCancel) {
		config.confirmButtonText = config.confirmButtonText || (config.type === 'error' ? t('Ok') : t('Send'));
		config.cancelButtonText = config.cancelButtonText || t('Cancel');
		config.closeOnConfirm = config.closeOnConfirm == null ? true : config.closeOnConfirm;
		config.showConfirmButton = config.showConfirmButton == null ? true : config.showConfirmButton;
		config.showFooter = config.showConfirmButton === true || config.showCancelButton === true;
		config.confirmOnEnter = config.confirmOnEnter == null ? true : config.confirmOnEnter;

		if (config.type === 'input') {
			config.input = true;
			config.type = false;

			if (!config.inputType) {
				config.inputType = 'text';
			}
		}

		this.close();
		this.fn = fn;
		this.onCancel = onCancel;
		this.config = config;

		if (config.dontAskAgain) {
			const dontAskAgainList = getUserPreference(Meteor.userId(), 'dontAskAgainList');

			if (dontAskAgainList && dontAskAgainList.some((dontAsk) => dontAsk.action === config.dontAskAgain.action)) {
				this.confirm(true);
				return;
			}
		}

		this.renderedModal = Blaze.renderWithData(Template.rc_modal, config, document.body);
		this.timer = null;
		if (config.timer) {
			this.timer = setTimeout(() => this.close(), config.timer);
		}
	},
	cancel() {
		if (this.onCancel) {
			this.onCancel();
		}
		this.close();
	},
	close() {
		if (this.renderedModal) {
			Blaze.remove(this.renderedModal);
		}
		this.fn = null;
		this.onCancel = null;
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
		if (modal.config.confirmOnEnter && e.key === 'Enter') {
			e.preventDefault();
			e.stopPropagation();

			if (modal.config.input) {
				return modal.confirm($('.js-modal-input').val());
			}

			modal.confirm(true);
		} else if (e.key === 'Escape') {
			e.preventDefault();
			e.stopPropagation();

			modal.close();
		}
	},
};

Template.rc_modal.helpers({
	hasAction() {
		return !!this.action;
	},
	type() {
		return this.type && `rc-modal__content-icon rc-modal__content-icon--modal-${ this.type }`;

	},
	modalIcon() {
		switch (this.type) {
			case 'success':
				return 'checkmark-circled';
			case 'error':
				return 'circle-cross';
			case 'info':
				return 'info-circled';
			default:
				return `modal-${ this.type }`;
		}
	},
});

Template.rc_modal.onRendered(function() {
	if (this.data.onRendered) {
		this.data.onRendered();
	}

	if (this.data.input) {
		$('.js-modal-input').focus();
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
		modal.cancel();
	},
	'click .js-confirm'(e, instance) {
		e.stopPropagation();
		const { dontAskAgain } = instance.data;
		if (dontAskAgain && document.getElementById('dont-ask-me-again').checked) {
			const dontAskAgainObject = {
				action: dontAskAgain.action,
				label: dontAskAgain.label,
			};

			let dontAskAgainList = getUserPreference(Meteor.userId(), 'dontAskAgainList');
			if (dontAskAgainList) {
				dontAskAgainList.push(dontAskAgainObject);
			} else {
				dontAskAgainList = [dontAskAgainObject];
			}

			Meteor.call('saveUserPreferences', { dontAskAgainList }, function(error) {
				if (error) {
					return handleError(error);
				}
			});
		}

		if (instance.data.input) {
			modal.confirm(document.getElementsByClassName('js-modal-input')[0].value);
			return;
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
	},
});

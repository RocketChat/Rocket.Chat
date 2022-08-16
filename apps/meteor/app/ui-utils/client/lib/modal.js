import { Meteor } from 'meteor/meteor';
import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';

import { t, getUserPreference } from '../../../utils';
import { dispatchToastMessage } from '../../../../client/lib/toast';
import './modal.html';

let modalStack = [];

const createModal = (config = {}, fn, onCancel) => {
	config.confirmButtonText = config.confirmButtonText || (config.type === 'error' ? t('Ok') : t('Send'));
	config.cancelButtonText = config.cancelButtonText || t('Cancel');
	config.closeOnConfirm = config.closeOnConfirm == null ? true : config.closeOnConfirm;
	config.showConfirmButton = config.showConfirmButton == null ? true : config.showConfirmButton;
	config.showFooter = config.showConfirmButton === true || config.showCancelButton === true;
	config.confirmOnEnter = config.confirmOnEnter == null ? true : config.confirmOnEnter;
	config.closeOnEscape = config.closeOnEscape == null ? true : config.closeOnEscape;

	if (config.type === 'input') {
		config.input = true;
		config.type = false;

		if (!config.inputType) {
			config.inputType = 'text';
		}
	}

	let renderedModal;
	let timer;

	const instance = {
		...config,

		render: () => {
			if (renderedModal) {
				renderedModal.firstNode().style.display = '';
				return;
			}

			renderedModal = Blaze.renderWithData(Template.rc_modal, instance, document.body);

			if (config.timer) {
				timer = setTimeout(() => {
					instance.close();
				}, config.timer);
			}
		},

		hide: () => {
			if (renderedModal) {
				renderedModal.firstNode().style.display = 'none';
			}

			if (timer) {
				clearTimeout(timer);
				timer = undefined;
			}
		},

		destroy: () => {
			if (renderedModal) {
				Blaze.remove(renderedModal);
				renderedModal = undefined;
			}

			if (timer) {
				clearTimeout(timer);
				timer = undefined;
			}
		},

		close: () => {
			if (onCancel) {
				onCancel.call(instance);
			}
			instance.destroy();
			modalStack = modalStack.filter((modal) => modal !== instance);
			if (modalStack.length) {
				modalStack[modalStack.length - 1].render();
			}
		},

		confirm: (value) => {
			config.closeOnConfirm && instance.close();

			if (fn) {
				fn.call(instance, value);
				return;
			}

			instance.close();
		},

		cancel: () => {
			instance.close();
		},

		showInputError: (text) => {
			const errorEl = document.querySelector('.rc-modal__content-error');
			errorEl.innerHTML = text;
			errorEl.style.display = 'block';
		},
	};

	return instance;
};

export const modal = {
	open: (config = {}, fn, onCancel) => {
		modalStack.forEach((instance) => {
			instance.destroy();
		});
		modalStack = [];

		const instance = createModal(config, fn, onCancel);

		if (config.dontAskAgain) {
			const dontAskAgainList = getUserPreference(Meteor.userId(), 'dontAskAgainList');

			if (dontAskAgainList && dontAskAgainList.some((dontAsk) => dontAsk.action === config.dontAskAgain.action)) {
				instance.confirm(true);
				return;
			}
		}

		instance.render();
		modalStack.push(instance);
	},
	push: (config = {}, fn, onCancel) => {
		const instance = createModal(config, fn, onCancel);

		modalStack.forEach((instance) => {
			instance.hide();
		});
		instance.render();
		modalStack.push(instance);
		return instance;
	},
	cancel: () => {
		if (modalStack.length) {
			modalStack[modalStack.length - 1].cancel();
		}
	},
	close: () => {
		if (modalStack.length) {
			modalStack[modalStack.length - 1].close();
		}
	},
	confirm: (value) => {
		if (modalStack.length) {
			modalStack[modalStack.length - 1].confirm(value);
		}
	},
	showInputError: (text) => {
		if (modalStack.length) {
			modalStack[modalStack.length - 1].showInputError(text);
		}
	},
	onKeyDown: (event) => {
		if (!modalStack.length) {
			return;
		}
		const instance = modalStack[modalStack.length - 1];
		if (event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();

			instance.close();
		}

		if (instance && instance.confirmOnEnter && event.key === 'Enter') {
			event.preventDefault();
			event.stopPropagation();

			if (instance.input) {
				return instance.confirm($('.js-modal-input').val());
			}

			instance.confirm(true);
		}
	},
};

Template.rc_modal.helpers({
	showFooter() {
		const { showCancelButton, showConfirmButton } = this;
		return showCancelButton || showConfirmButton;
	},
	hasAction() {
		return !!this.action;
	},
	type() {
		return this.type && `rc-modal__content-icon rc-modal__content-icon--modal-${this.type}`;
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
				return `modal-${this.type}`;
		}
	},
});

Template.rc_modal.onRendered(function () {
	this.oldFocus = document.activeElement;
	if (this.data.input) {
		$('.js-modal-input', this.firstNode).focus();
	} else if (this.data.showConfirmButton && this.data.confirmOnEnter) {
		$('.js-confirm', this.firstNode).focus();
	}
	if (this.data.onRendered) {
		this.data.onRendered();
	}
	this.data.closeOnEscape && document.addEventListener('keydown', modal.onKeyDown);
});

Template.rc_modal.onDestroyed(function () {
	this.oldFocus && this.oldFocus.focus();
	document.removeEventListener('keydown', modal.onKeyDown);
});

Template.rc_modal.events({
	'click .js-action'(event, instance) {
		!this.action || this.action.call(instance.data.data, event, instance);
		event.stopPropagation();
		this.close();
	},
	'click .js-input-action'(e, instance) {
		!this.inputAction || this.inputAction.call(instance.data.data, e, instance);
		e.stopPropagation();
	},
	'click .js-close'(e) {
		e.preventDefault();
		e.stopPropagation();
		this.cancel();
	},
	'click .js-confirm'(event, instance) {
		event.stopPropagation();
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

			Meteor.call('saveUserPreferences', { dontAskAgainList }, function (error) {
				if (error) {
					dispatchToastMessage({ type: 'error', message: error });
				}
			});
		}

		if (instance.data.input) {
			this.confirm(document.getElementsByClassName('js-modal-input')[0].value);
			return;
		}

		this.confirm(true);
	},
	'click .rc-modal-wrapper'(event, instance) {
		if (instance.data.allowOutsideClick === false) {
			return false;
		}

		if (event.currentTarget === event.target) {
			event.stopPropagation();
			this.close();
		}
	},
});

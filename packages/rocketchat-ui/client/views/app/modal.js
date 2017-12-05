/* globals modal */

this.modal = {
	renderedModal: null,
	open(config = {}, fn) {
		config.confirmButtonText = config.confirmButtonText || t('Send');
		config.cancelButtonText = config.cancelButtonText || t('Cancel');

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
	confirm() {
		this.fn(true);
		this.config.closeOnConfirm && this.close();
	}
};

Template.rc_modal.helpers({
	hasAction() {
		return !!this.action;
	}
});

Template.rc_modal.onRendered(function() {
	if (this.data.onRendered) {
		this.data.onRendered();
	}

	$('.rc-modal-wrapper').click(function(e) {
		if (e.currentTarget === e.target) {
			modal.close();
		}
	});
});

Template.rc_modal.events({
	'click .js-action'(e, instance) {
		!this.action || this.action.call(instance.data.data, e, instance);
		modal.close();
	},
	'click .js-close'() {
		modal.close();
	},
	'click .js-confirm'() {
		modal.confirm();
	}
});

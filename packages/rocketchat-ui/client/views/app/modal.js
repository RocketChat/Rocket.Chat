/* globals modal */

this.modal = {
	renderedModal: null,
	open(config) {
		this.close();
		this.renderedModal = Blaze.renderWithData(Template.rc_modal, config, document.body);
	},
	close() {
		if (this.renderedModal) {
			Blaze.remove(this.renderedModal);
		}

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
	}
});

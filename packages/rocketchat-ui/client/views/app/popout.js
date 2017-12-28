/* globals popout */

this.popout = {
	context: null,
	open(config = {}, fn) {
		this.close();
		this.context = Blaze.renderWithData(Template.popout, config, document.body);
		this.fn = fn;
		this.config = config;
		this.timer = null;
		if (config.timer) {
			this.timer = setTimeout(() => this.close(), config.timer);
		}
	},
	close() {
		if (this.context) {
			Blaze.remove(this.context);
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
	}
};

Template.popout.helpers({
	hasAction() {
		return !!this.action;
	},
	modalIcon() {
		return `modal-${ this.type }`;
	}
});

Template.popout.onRendered(function() {
	if (this.data.onRendered) {
		this.data.onRendered();
	}
});

Template.popout.onDestroyed(function() {
});

Template.popout.events({
	'click .js-action'(e, instance) {
		!this.action || this.action.call(instance.data.data, e, instance);
		e.stopPropagation();
		popout.close();
	},
	'click .js-close'(e) {
		e.stopPropagation();
		popout.close();
	}
});

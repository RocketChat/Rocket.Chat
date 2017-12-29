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
	}
};

Template.popout.helpers({
	state() {
		return Template.instance().isMinimized.get() ? 'closed' : 'open';
	}
});

Template.popout.onRendered(function() {
	if (this.data.onRendered) {
		this.data.onRendered();
	}
});
Template.popout.onCreated(function() {
	this.locatePopout = new ReactiveVar('close');
	this.isMinimized = new ReactiveVar(false);
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
	},
	'click .js-minimize'(e, i) {
		e.stopPropagation();
		if (i.isMinimized.get()) {
			i.isMinimized.set(false);
			document.querySelector('.rc-popout iframe').height = '350px';
		} else {
			i.isMinimized.set(true);
			document.querySelector('.rc-popout iframe').height = '40px';
		}
	}
});

RocketChat.callbacks.add('afterLogoutCleanUp', () => popout.close(), RocketChat.callbacks.priority.MEDIUM, 'popout-close-after-logout-cleanup');

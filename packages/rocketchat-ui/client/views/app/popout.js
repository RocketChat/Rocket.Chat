/* globals popout */

this.popout = {
	context: null,
	docked: true,
	open(config = {}, fn) {
		this.close();
		this.context = Blaze.renderWithData(Template.popout, config, document.body);
		this.fn = fn;
		this.config = config;
		this.timer = null;
		if (config.timer) {
			this.timer = setTimeout(() => this.close(), config.timer);
		}
		if (config.docked != null) {
			this.docked = config.docked;
		}
	},
	close() {
		if (this.context) {
			Blaze.remove(this.context);
		}
		this.context = null;
		this.fn = null;
		if (this.timer) {
			clearTimeout(this.timer);
		}
	}
};

Template.popout.helpers({
	state() {
		return Template.instance().isMinimized.get() ? 'closed' : 'open';
	},
	style() {
		return Template.instance().isDocked.get() ? 'docked' : 'undocked';
	},
	isDocked() {
		return Template.instance().isDocked.get();
	}
});

Template.popout.onRendered(function() {
	if (this.data.onRendered) {
		this.data.onRendered();
	}
});
Template.popout.onCreated(function() {
	this.isDocked = new ReactiveVar(popout.docked);
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
	'click .js-close'(e, i) {
		e.stopPropagation();
		popout.docked = true;
		const livestreamTab = document.querySelector('.flex-tab--livestream');
		let livestreamTabSource;
		let popoutSource;
		try {
			livestreamTabSource = Blaze.getView(livestreamTab).templateInstance().streamingOptions.get().url;
			popoutSource = Blaze.getData(popout.context).data && Blaze.getData(popout.context).data.streamingSource;
			if (livestreamTab == null || livestreamTabSource !== popoutSource) {
				popout.close();
				popout.open({
					content: 'liveStreamView',
					data: {
						'streamingSource': livestreamTabSource
					}
				});
			} else {
				i.isDocked.set(true);
			}
		} catch (e) {
			console.log(e);
			popout.close();
		}
	},
	'click .js-minimize'(e, i) {
		e.stopPropagation();
		if (i.isMinimized.get()) {
			i.isMinimized.set(false);
			document.querySelector('.rc-popout object').height = '350px';
		} else {
			i.isMinimized.set(true);
			document.querySelector('.rc-popout object').height = '40px';
		}
	},
	'click .js-dock'(e, i) {
		e.stopPropagation();
		popout.docked = !i.isDocked.get();
		i.isDocked.set(!i.isDocked.get());
	}
});

RocketChat.callbacks.add('afterLogoutCleanUp', () => popout.close(), RocketChat.callbacks.priority.MEDIUM, 'popout-close-after-logout-cleanup');

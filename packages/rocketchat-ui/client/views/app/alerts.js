this.alerts = {
	renderedAlert: null,
	open(config) {
		this.close();

		if (config.timer) {
			this.timer = setTimeout(() => this.close(), config.timer);
		}

		this.renderedAlert = Blaze.renderWithData(Template.alerts, config, document.body, document.body.querySelector('#rocket-chat'));
	},
	close() {

		if (this.timer) {
			clearTimeout(this.timer);
			delete this.timer;
		}
		if (!this.renderedAlert) {
			return false;
		}

		Blaze.remove(this.renderedAlert);

		const activeElement = this.renderedAlert.dataVar.curValue.activeElement;
		if (activeElement) {
			$(activeElement).removeClass('active');
		}
	}
};

Template.alerts.helpers({
	hasAction() {
		return !!this.action;
	}
});

Template.alerts.onRendered(function() {
	if (this.data.onRendered) {
		this.data.onRendered();
	}
});

Template.alerts.onDestroyed(function() {
	if (this.data.onDestroyed) {
		this.data.onDestroyed();
	}
});

Template.alerts.events({
	'click .js-action'(e, instance) {
		if (!this.action) {
			return;
		}
		this.action.call(this, e, instance.data.data);
		alerts.close();
	},
	'click .js-close'() {
		alerts.close();
	}
});

Template.alerts.helpers({
	isSafariIos: /iP(ad|hone|od).+Version\/[\d\.]+.*Safari/i.test(navigator.userAgent)
});

/* globals CustomFields, Livechat */
const api = {
	pageVisited(info) {
		if (info.change === 'url') {
			Triggers.processRequest(info);
		}

		Meteor.call('livechat:pageVisited', visitor.getToken(), info);
	},

	setCustomField(key, value, overwrite = true) {
		CustomFields.setCustomField(visitor.getToken(), key, value, overwrite);
	},

	setTheme(theme) {
		if (theme.color) {
			Livechat.customColor = theme.color;
		}
		if (theme.fontColor) {
			Livechat.customFontColor = theme.fontColor;
		}
	},

	setDepartment(department) {
		Livechat.department = department;
	},

	clearDepartment() {
		Livechat.department = null;
	},

	widgetOpened() {
		Livechat.setWidgetOpened();
	},

	widgetClosed() {
		Livechat.setWidgetClosed();
	}
};

window.addEventListener('message', function(msg) {
	if (typeof msg.data === 'object' && msg.data.src !== undefined && msg.data.src === 'rocketchat') {
		if (api[msg.data.fn] !== undefined && typeof api[msg.data.fn] === 'function') {
			const args = [].concat(msg.data.args || []);
			api[msg.data.fn].apply(null, args);
		}
	}
}, false);

// tell parent window that we are ready
Meteor.startup(function() {
	Tracker.autorun((c) => {
		if (Livechat.isReady()) {
			parentCall('ready');
			c.stop();
		}
	});
});

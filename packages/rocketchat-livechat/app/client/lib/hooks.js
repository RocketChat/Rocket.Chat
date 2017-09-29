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

	setLanguage(language) {
		Livechat.language = language;

		Meteor.call('livechat:getTextsTranslation', Livechat.language,
			(err, result) => {
				if (err) {
					console.error(err);
				} else {
					if (Livechat.online) {
						if (result.title) { Livechat.title = result.title; }
					} else {
						if (result.offlineTitle) { Livechat.title = result.offlineTitle; }
						if (result.offlineMessage) { Livechat.offlineMessage = result.offlineMessage; }
						if (result.offlineUnavailableMessage) { Livechat.offlineUnavailableMessage = result.offlineUnavailableMessage; }
						if (result.offlineSuccessMessage) { Livechat.offlineSuccessMessage = result.offlineSuccessMessage; }
					}

					localStorage.setItem('userLanguage', result.language);
					TAPi18n.setLanguage(result.language);
				}
			});
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

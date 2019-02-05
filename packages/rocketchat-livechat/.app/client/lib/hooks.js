/* globals CustomFields, Livechat */
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { Tracker } from 'meteor/tracker';
import visitor from '../../imports/client/visitor';

const api = {
	pageVisited(info) {
		if (info.change === 'url') {
			Triggers.processRequest(info);
		}

		Meteor.call('livechat:pageVisited', visitor.getToken(), visitor.getRoom(), info);
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
	},

	setGuestToken(token) {
		visitor.setToken(token);
	},

	setGuestName(name) {
		visitor.setName(name);
	},

	setGuestEmail(email) {
		visitor.setEmail(email);
	},

	registerGuest(data) {
		if (typeof data !== 'object') {
			return;
		}

		if (!data.token) {
			data.token = Random.id();
		}

		if (data.department) {
			api.setDepartment(data.department);
		}

		Meteor.call('livechat:registerGuest', data, function(error, result) {
			if (!error) {
				visitor.reset();
			}

			if (result && result.visitor && result.visitor.token) {
				visitor.setToken(result.visitor.token);
				visitor.setId(result.userId);
				visitor.setData(result.visitor);
			}
		});
	},
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

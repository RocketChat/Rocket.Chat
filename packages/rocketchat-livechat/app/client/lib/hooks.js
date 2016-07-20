/* globals CustomFields, Livechat */
var api = {
	pageVisited: function(info) {
		if (info.change === 'url') {
			Triggers.processRequest(info);
		}

		Meteor.call('livechat:pageVisited', visitor.getToken(), info);
	},

	setCustomField: function(key, value) {
		CustomFields.setCustomField(visitor.getToken(), key, value);
	},

	setTheme: function(theme) {
		if (theme.color) {
			Livechat.customColor = theme.color;
		}
	}
};

window.addEventListener('message', function(msg) {
	if (typeof msg.data === 'object' && msg.data.src !== undefined && msg.data.src === 'rocketchat') {
		if (api[msg.data.fn] !== undefined && typeof api[msg.data.fn] === 'function') {
			var args = [].concat(msg.data.args || []);
			api[msg.data.fn].apply(null, args);
		}
	}
}, false);

// tell parent window that we are ready
Meteor.startup(function() {
	parentCall('ready');
});

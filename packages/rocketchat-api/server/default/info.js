var client = require('prom-client');
 
var defaultMetrics = client.defaultMetrics;

RocketChat.API.default.addRoute('info', { authRequired: false }, {
	get: function() {
		return RocketChat.Info;
	}
});

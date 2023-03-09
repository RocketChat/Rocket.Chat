if (Meteor.isClient) {
	module.exports = require('./main_client');
}

if (Meteor.isServer) {
	module.exports = require('./main_server');
}

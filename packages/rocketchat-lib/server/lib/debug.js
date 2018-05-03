/* global InstanceStatus */
import _ from 'underscore';

const logger = new Logger('Meteor', {
	methods: {
		method: {
			type: 'debug'
		},
		publish: {
			type: 'debug'
		}
	}
});

const wrapMethods = function(name, originalHandler, methodsMap) {
	methodsMap[name] = function() {
		const args = name === 'ufsWrite' ? Array.prototype.slice.call(arguments, 1) : arguments;
		logger.method(name, '-> userId:', Meteor.userId(), ', arguments: ', args);

		return originalHandler.apply(this, arguments);
	};
};

const originalMeteorMethods = Meteor.methods;

Meteor.methods = function(methodMap) {
	_.each(methodMap, function(handler, name) {
		wrapMethods(name, handler, methodMap);
	});
	originalMeteorMethods(methodMap);
};

const originalMeteorPublish = Meteor.publish;

Meteor.publish = function(name, func) {
	return originalMeteorPublish(name, function() {
		logger.publish(name, '-> userId:', this.userId, ', arguments: ', arguments);

		return func.apply(this, arguments);
	});
};

WebApp.rawConnectHandlers.use(function(req, res, next) {
	res.setHeader('X-Instance-ID', InstanceStatus.id());
	return next();
});

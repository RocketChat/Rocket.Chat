var logger = new Logger('Meteor', {
	methods: {
		method: {
			type: 'debug'
		},
		publish: {
			type: 'debug'
		}
	}
});

var wrapMethods = function(name, originalHandler, methodsMap) {
	methodsMap[name] = function() {
		var args = name === 'ufsWrite' ? Array.prototype.slice.call(arguments, 1) : arguments;
		logger.method(name, '-> userId:', Meteor.userId(), ', arguments: ', args);

		return originalHandler.apply(this, arguments);
	};
};

var originalMeteorMethods = Meteor.methods;

Meteor.methods = function(methodMap) {
	_.each(methodMap, function(handler, name) {
		wrapMethods(name, handler, methodMap);
	});
	originalMeteorMethods(methodMap);
};

var originalMeteorPublish = Meteor.publish;

Meteor.publish = function(name, func) {
	return originalMeteorPublish(name, function() {
		logger.publish(name, '-> userId:', this.userId, ', arguments: ', arguments);

		return func.apply(this, arguments);
	});
};

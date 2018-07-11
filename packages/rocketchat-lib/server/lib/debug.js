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

let Log_Trace_Methods;
let Log_Trace_Subscriptions;
RocketChat.settings.get('Log_Trace_Methods', (key, value) => Log_Trace_Methods = value);
RocketChat.settings.get('Log_Trace_Subscriptions', (key, value) => Log_Trace_Subscriptions = value);

let Log_Trace_Methods_Filter;
let Log_Trace_Subscriptions_Filter;
RocketChat.settings.get('Log_Trace_Methods_Filter', (key, value) => Log_Trace_Methods_Filter = value ? new RegExp(value) : undefined);
RocketChat.settings.get('Log_Trace_Subscriptions_Filter', (key, value) => Log_Trace_Subscriptions_Filter = value ? new RegExp(value) : undefined);

const traceConnection = (enable, filter, prefix, name, connection, userId) => {
	if (!enable) {
		return;
	}

	if (filter && !filter.test(name)) {
		return;
	}

	if (connection) {
		console.log(name, {
			id: connection.id,
			clientAddress: connection.clientAddress,
			httpHeaders: connection.httpHeaders,
			userId
		});
	} else {
		console.log(name, 'no-connection');
	}
};

const wrapMethods = function(name, originalHandler, methodsMap) {
	methodsMap[name] = function() {
		traceConnection(Log_Trace_Methods, Log_Trace_Methods_Filter, 'method', name, this.connection, this.userId);
		const end = RocketChat.metrics.meteorMethods.startTimer({
			method: name,
			has_connection: this.connection != null,
			has_user: this.userId != null
		});
		const args = name === 'ufsWrite' ? Array.prototype.slice.call(arguments, 1) : arguments;
		logger.method(name, '-> userId:', Meteor.userId(), ', arguments: ', args);

		this.unblock();
		const result = originalHandler.apply(this, arguments);
		end();
		return result;
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
		traceConnection(Log_Trace_Subscriptions, Log_Trace_Subscriptions_Filter, 'subscription', name, this.connection, this.userId);
		logger.publish(name, '-> userId:', this.userId, ', arguments: ', arguments);
		const end = RocketChat.metrics.meteorSubscriptions.startTimer({subscription: name});

		const originalReady = this.ready;
		this.ready = function() {
			end();
			return originalReady.apply(this, arguments);
		};

		return func.apply(this, arguments);
	});
};

WebApp.rawConnectHandlers.use(function(req, res, next) {
	res.setHeader('X-Instance-ID', InstanceStatus.id());
	return next();
});

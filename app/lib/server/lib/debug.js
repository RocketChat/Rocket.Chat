import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { InstanceStatus } from 'meteor/konecty:multiple-instances-status';
import { settings } from '../../../settings';
import { metrics } from '../../../metrics';
import _ from 'underscore';
import { Logger } from '../../../logger';

const logger = new Logger('Meteor', {
	methods: {
		method: {
			type: 'debug',
		},
		publish: {
			type: 'debug',
		},
	},
});

let Log_Trace_Methods;
let Log_Trace_Subscriptions;
settings.get('Log_Trace_Methods', (key, value) => Log_Trace_Methods = value);
settings.get('Log_Trace_Subscriptions', (key, value) => Log_Trace_Subscriptions = value);

let Log_Trace_Methods_Filter;
let Log_Trace_Subscriptions_Filter;
settings.get('Log_Trace_Methods_Filter', (key, value) => Log_Trace_Methods_Filter = value ? new RegExp(value) : undefined);
settings.get('Log_Trace_Subscriptions_Filter', (key, value) => Log_Trace_Subscriptions_Filter = value ? new RegExp(value) : undefined);

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
			userId,
		});
	} else {
		console.log(name, 'no-connection');
	}
};

const wrapMethods = function(name, originalHandler, methodsMap) {
	methodsMap[name] = function(...originalArgs) {
		traceConnection(Log_Trace_Methods, Log_Trace_Methods_Filter, 'method', name, this.connection, this.userId);
		const end = metrics.meteorMethods.startTimer({
			method: name === 'stream' ? `${ name }:${ originalArgs[0] }` : name,
			has_connection: this.connection != null,
			has_user: this.userId != null,
		});
		const args = name === 'ufsWrite' ? Array.prototype.slice.call(originalArgs, 1) : originalArgs;
		logger.method(name, '-> userId:', Meteor.userId(), ', arguments: ', args);
		const result = originalHandler.apply(this, originalArgs);
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
	return originalMeteorPublish(name, function(...args) {
		traceConnection(Log_Trace_Subscriptions, Log_Trace_Subscriptions_Filter, 'subscription', name, this.connection, this.userId);
		logger.publish(name, '-> userId:', this.userId, ', arguments: ', args);
		const end = metrics.meteorSubscriptions.startTimer({ subscription: name });

		const originalReady = this.ready;
		this.ready = function() {
			end();
			return originalReady.apply(this, args);
		};

		return func.apply(this, args);
	});
};

WebApp.rawConnectHandlers.use(function(req, res, next) {
	res.setHeader('X-Instance-ID', InstanceStatus.id());
	return next();
});

import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { InstanceStatus } from 'meteor/konecty:multiple-instances-status';
import _ from 'underscore';

import { settings } from '../../../settings/server';
import { metrics } from '../../../metrics/server';
import { Logger } from '../../../../server/lib/logger/Logger';
import { getMethodArgs } from '../../../../server/lib/logger/logPayloads';

const logger = new Logger('Meteor');

let Log_Trace_Methods;
let Log_Trace_Subscriptions;
settings.watch('Log_Trace_Methods', (value) => {
	Log_Trace_Methods = value;
});
settings.watch('Log_Trace_Subscriptions', (value) => {
	Log_Trace_Subscriptions = value;
});

let Log_Trace_Methods_Filter;
let Log_Trace_Subscriptions_Filter;
settings.watch('Log_Trace_Methods_Filter', (value) => {
	Log_Trace_Methods_Filter = value ? new RegExp(value) : undefined;
});
settings.watch('Log_Trace_Subscriptions_Filter', (value) => {
	Log_Trace_Subscriptions_Filter = value ? new RegExp(value) : undefined;
});

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

const wrapMethods = function (name, originalHandler, methodsMap) {
	methodsMap[name] = function (...originalArgs) {
		traceConnection(Log_Trace_Methods, Log_Trace_Methods_Filter, 'method', name, this.connection, this.userId);

		const method = name === 'stream' ? `${name}:${originalArgs[0]}` : name;

		const end = metrics.meteorMethods.startTimer({
			method,
			has_connection: this.connection != null,
			has_user: this.userId != null,
		});

		logger.method({
			method,
			userId: Meteor.userId(),
			userAgent: this.connection?.httpHeaders['user-agent'],
			referer: this.connection?.httpHeaders.referer,
			remoteIP: this.connection?.clientAddress,
			instanceId: InstanceStatus.id(),
			...getMethodArgs(name, originalArgs),
		});

		const result = originalHandler.apply(this, originalArgs);
		end();
		return result;
	};
};

const originalMeteorMethods = Meteor.methods;

Meteor.methods = function (methodMap) {
	_.each(methodMap, function (handler, name) {
		wrapMethods(name, handler, methodMap);
	});
	originalMeteorMethods(methodMap);
};

const originalMeteorPublish = Meteor.publish;

Meteor.publish = function (name, func) {
	return originalMeteorPublish(name, function (...args) {
		traceConnection(Log_Trace_Subscriptions, Log_Trace_Subscriptions_Filter, 'subscription', name, this.connection, this.userId);

		logger.subscription({
			publication: name,
			userId: this.userId,
			userAgent: this.connection?.httpHeaders['user-agent'],
			referer: this.connection?.httpHeaders.referer,
			remoteIP: this.connection?.clientAddress,
			instanceId: InstanceStatus.id(),
		});

		const end = metrics.meteorSubscriptions.startTimer({ subscription: name });

		const originalReady = this.ready;
		this.ready = function () {
			end();
			return originalReady.apply(this, args);
		};

		return func.apply(this, args);
	});
};

WebApp.rawConnectHandlers.use(function (req, res, next) {
	res.setHeader('X-Instance-ID', InstanceStatus.id());
	return next();
});

import type { IncomingMessage, ServerResponse } from 'http';

import { InstanceStatus } from '@rocket.chat/instance-status';
import { Logger } from '@rocket.chat/logger';
import { tracerActiveSpan } from '@rocket.chat/tracing';
import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import _ from 'underscore';

import { getMethodArgs } from '../../../../server/lib/logger/logPayloads';
import { metrics } from '../../../metrics/server';
import { settings } from '../../../settings/server';
import { getModifiedHttpHeaders } from '../functions/getModifiedHttpHeaders';

const logger = new Logger('Meteor');

let logTraceMethods: boolean | undefined;
let logTraceSubscriptions: boolean | undefined;
settings.watch('Log_Trace_Methods', (value) => {
	logTraceMethods = value as boolean;
});
settings.watch('Log_Trace_Subscriptions', (value) => {
	logTraceSubscriptions = value as boolean;
});

let logTraceMethodsFilter: RegExp | undefined;
let logTraceSubscriptionsFilter: RegExp | undefined;
settings.watch('Log_Trace_Methods_Filter', (value) => {
	logTraceMethodsFilter = value ? new RegExp(value as string) : undefined;
});
settings.watch('Log_Trace_Subscriptions_Filter', (value) => {
	logTraceSubscriptionsFilter = value ? new RegExp(value as string) : undefined;
});

const traceConnection = (
	enable: boolean | undefined,
	filter: RegExp | undefined,
	_prefix: string,
	name: string,
	connection: Meteor.Connection | null | undefined,
	userId: string | null,
): void => {
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
			httpHeaders: getModifiedHttpHeaders(connection.httpHeaders),
			userId,
		});
	} else {
		console.log(name, 'no-connection');
	}
};

const wrapMethods = function (name: string, originalHandler: (...args: any[]) => any, methodsMap: Record<string, any>): void {
	methodsMap[name] = function (this: Meteor.MethodThisType, ...originalArgs: any[]) {
		traceConnection(logTraceMethods, logTraceMethodsFilter, 'method', name, this.connection, this.userId);

		const method = name === 'stream' ? `${name}:${originalArgs[0]}` : name;

		const end = (metrics.meteorMethods.startTimer as any)({
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

		return tracerActiveSpan(
			`Method ${name}`,
			{
				attributes: {
					method: name,
					userId: this.userId ?? undefined,
				},
			},
			async () => {
				const result = await originalHandler.apply(this, originalArgs);
				end();
				return result;
			},
		);
	};
};

const originalMeteorMethods = Meteor.methods;

(Meteor as any).methods = function (methodMap: Record<string, (...args: any[]) => any>): void {
	_.each(methodMap, (handler, name) => {
		wrapMethods(name, handler, methodMap);
	});
	originalMeteorMethods(methodMap);
};

const originalMeteorPublish = Meteor.publish;

(Meteor as any).publish = function (name: string, func: (...args: any[]) => any) {
	return originalMeteorPublish(name, function (this: any, ...args: any[]) {
		traceConnection(logTraceSubscriptions, logTraceSubscriptionsFilter, 'subscription', name, this.connection, this.userId);

		logger.subscription({
			publication: name,
			userId: this.userId,
			userAgent: this.connection?.httpHeaders['user-agent'],
			referer: this.connection?.httpHeaders.referer,
			remoteIP: this.connection?.clientAddress,
			instanceId: InstanceStatus.id(),
		});

		const end = (metrics.meteorSubscriptions.startTimer as any)({ subscription: name });

		const originalReady = this.ready;
		this.ready = function (this: any) {
			end();
			return originalReady.call(this);
		};

		return func.apply(this, args);
	});
};

WebApp.rawConnectHandlers.use((_req: IncomingMessage, res: ServerResponse, next: () => void) => {
	res.setHeader('X-Instance-ID', InstanceStatus.id());
	return next();
});

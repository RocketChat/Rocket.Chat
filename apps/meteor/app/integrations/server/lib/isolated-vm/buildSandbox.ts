import { EventEmitter } from 'events';
import ivm, { type Context } from 'isolated-vm';
import { serverFetch, Response } from '@rocket.chat/server-fetch';
type ServerFetchOptions = Parameters<typeof serverFetch>[1];
import * as s from '../../../../../lib/utils/stringUtils';

type SandboxLog = {
	level: 'log' | 'warn' | 'error';
	message: string;
	timestamp: Date;
};

const isTransferable = (data: any): boolean => {
	const type = typeof data;

	if (data === ivm) return true;
	if (['undefined', 'string', 'number', 'boolean', 'function'].includes(type)) return true;
	if (type !== 'object' || data === null) return false;

	return (
		data instanceof ivm.Isolate ||
		data instanceof ivm.Context ||
		data instanceof ivm.Script ||
		data instanceof ivm.ExternalCopy ||
		data instanceof ivm.Reference ||
		data instanceof ivm.Callback
	);
};

const proxyObject = (obj: Record<string, any>, forbidden: string[] = []) => ({
	isProxy: true,
	get: (key: string) => {
		if (forbidden.includes(key)) return undefined;

		const value = obj[key];
		if (typeof value === 'function') {
			return new ivm.Reference(async (...args: any[]) => {
				const result = value(...args);
				return makeTransferable(await Promise.resolve(result));
			});
		}

		return makeTransferable(value);
	},
});

const copyObject = (obj: any): any => {
	if (Array.isArray(obj)) {
		return obj.map(copyObject);
	}

	if (obj instanceof Response) {
		return proxyObject(obj, ['clone']);
	}

	if (obj instanceof ArrayBuffer) {
		return obj;
	}

	if (obj instanceof EventEmitter) {
		return {};
	}

	if (obj && typeof obj === 'object') {
		return Object.fromEntries(
			Object.entries(obj).map(([key, value]) => {
				if (typeof value === 'function') {
					return [key, new ivm.Callback((...args: any[]) => value(...args))];
				}
				return [key, copyObject(value)];
			}),
		);
	}

	return obj;
};

const makeTransferable = (data: any): any => {
	if (isTransferable(data)) {
		return data;
	}
	return new ivm.ExternalCopy(copyObject(data)).copyInto();
};

export const buildSandbox = (context: Context) => {
	const { global } = context;

	const logs: SandboxLog[] = [];

	const pushLog = (level: SandboxLog['level'], args: unknown[]) => {
		const message = args
			.map((arg) => {
				if (typeof arg === 'string') {
					return arg;
				}
				try {
					return JSON.stringify(arg);
				} catch {
					return String(arg);
				}
			})
			.join(' ');

		logs.push({
			level,
			message,
			timestamp: new Date(),
		});
	};

	const sandboxConsole = {
		log: (...args: unknown[]) => pushLog('log', args),
		warn: (...args: unknown[]) => pushLog('warn', args),
		error: (...args: unknown[]) => pushLog('error', args),
	};

	global.setSync('global', global.derefInto());
	global.setSync('ivm', ivm);
	global.setSync('s', makeTransferable(s));
	global.setSync('console', makeTransferable(sandboxConsole));
	global.setSync(
		'serverFetch',
		new ivm.Reference(
			async (
				url: string,
				options?: ServerFetchOptions,
				allowSelfSignedCerts?: boolean,
			) => {
				const res = await serverFetch(url, options, allowSelfSignedCerts);
				return makeTransferable(res);
			},
		),
	);

	return { logs };
};

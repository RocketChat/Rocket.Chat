import { EventEmitter } from 'events';

import { serverFetch as fetch, Response } from '@rocket.chat/server-fetch';
import ivm, { type Context } from 'isolated-vm';

import * as s from '../../../../../lib/utils/stringUtils';

const proxyObject = (obj: Record<string, any>, forbiddenKeys: string[] = []): Record<string, any> => {
	return copyObject({
		isProxy: true,
		get: (key: string) => {
			if (forbiddenKeys.includes(key)) {
				return undefined;
			}

			const value = obj[key];

			if (typeof value === 'function') {
				return new ivm.Reference(async (...args: any[]) => {
					const result = (obj[key] as any)(...args);

					if (result && result instanceof Promise) {
						return new Promise(async (resolve, reject) => {
							try {
								const awaitedResult = await result;
								resolve(makeTransferable(awaitedResult));
							} catch (e) {
								reject(e);
							}
						});
					}

					return makeTransferable(result);
				});
			}

			return makeTransferable(value);
		},
	});
};

const copyObject = (obj: Record<string, any> | any[]): Record<string, any> | any[] => {
	if (Array.isArray(obj)) {
		return obj.map((data) => copyData(data));
	}

	if (obj instanceof Response) {
		return proxyObject(obj, ['clone']);
	}

	if (isSemiTransferable(obj)) {
		return obj;
	}

	if (typeof obj[Symbol.iterator as any] === 'function') {
		return copyObject(Array.from(obj as any));
	}

	if (obj instanceof EventEmitter) {
		return {};
	}

	const keys = Object.keys(obj);

	return {
		...Object.fromEntries(
			keys.map((key) => {
				const data = obj[key];

				if (typeof data === 'function') {
					return [key, new ivm.Callback((...args: any[]) => obj[key](...args))];
				}

				return [key, copyData(data)];
			}),
		),
	};
};

// Transferable data can be passed to isolates directly
const isTransferable = (data: any): data is ivm.Transferable => {
	const dataType = typeof data;

	if (data === ivm) {
		return true;
	}

	if (['null', 'undefined', 'string', 'number', 'boolean', 'function'].includes(dataType)) {
		return true;
	}

	if (dataType !== 'object') {
		return false;
	}

	return (
		data instanceof ivm.Isolate ||
		data instanceof ivm.Context ||
		data instanceof ivm.Script ||
		data instanceof ivm.ExternalCopy ||
		data instanceof ivm.Callback ||
		data instanceof ivm.Reference
	);
};

// Semi-transferable data can be copied with an ivm.ExternalCopy without needing any manipulation.
const isSemiTransferable = (data: any) => data instanceof ArrayBuffer;

const copyData = <T extends ivm.Transferable | Record<string, any> | any[]>(data: T) => (isTransferable(data) ? data : copyObject(data));
const makeTransferable = (data: any) => (isTransferable(data) ? data : new ivm.ExternalCopy(copyObject(data)).copyInto());

export const buildSandbox = (context: Context) => {
	const { global: jail } = context;
	jail.setSync('global', jail.derefInto());
	jail.setSync('ivm', ivm);

	jail.setSync('s', makeTransferable(s));
	jail.setSync('console', makeTransferable(console));

	jail.setSync(
		'serverFetch',
		new ivm.Reference(async (url: string, ...args: any[]) => {
			const result = await fetch(url, ...args);
			return makeTransferable(result);
		}),
	);
};

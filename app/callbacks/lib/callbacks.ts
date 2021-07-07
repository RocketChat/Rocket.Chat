/* eslint-disable @typescript-eslint/no-use-before-define */
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import _ from 'underscore';

let timed = false;

if (Meteor.isClient) {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const { getConfig } = require('../../ui-utils/client/config');
	timed = [getConfig('debug'), getConfig('timed-callbacks')].includes('true');
}
type ArgumentTypes<F extends Function> = F extends (...args: infer A) => any ? A : never;

/*
* Callback hooks provide an easy way to add extra steps to common operations.
* @namespace RocketChat.callbacks
*/

type Priority = number;

type ICallbackPayloadsProps<A, R = A, C = void> = {
	args: A;
	result: R;
	constant: C;
}

interface ICallbackProps {
	'': ICallbackPayloadsProps<void>;
}

type CallbackHookKey = keyof ICallbackProps & string;
type CallbackHookPayload<H extends CallbackHookKey> = ICallbackProps[H];

type Callback<H extends CallbackHookKey = CallbackHookKey, P = CallbackHookPayload<H>['args'], R = CallbackHookPayload<H>['result'], C = CallbackHookPayload<H>['constant'] > = (args: P, ...[constant]: CallbackConstant<C>) => R;
type CallbackConstant<C> = C extends void ? [undefined?] : [C]
type CallbackMeta <H extends CallbackHookKey = CallbackHookKey> = {
	hook: H;
	// data: (data: P) => P;
	priority: Priority;
	id: string;
	stack: string | undefined;
}

const hooks: Record<string, Callback[]> = {};
const meta = new WeakMap<Callback, CallbackMeta>();

const wrapCallback = (callback: Callback) => (...args: ArgumentTypes<Callback>): ReturnType<Callback> => {
	const cb = meta.get(callback);
	const time = Date.now();
	const result = callback(...args);
	if (!cb) {
		return result;
	}
	const currentTime = Date.now() - time;
	let stack: string | string[] | false | undefined = cb?.stack
		&& typeof cb.stack.split === 'function'
		&& cb.stack.split('\n');
	stack = stack && stack[2] && (stack[2].match(/\(.+\)/) || [])[0];
	console.log(String(currentTime), cb.hook, cb.id, stack);
	return result;
};

const wrapRun = (hook: CallbackHookKey, fn: Callback) => (...args: ArgumentTypes<Callback>): ReturnType<Callback> => {
	const time = Date.now();
	const ret = fn(...args);
	const totalTime = Date.now() - time;
	console.log(`${ hook }:`, totalTime);
	return ret;
};


const combinedCallbacks = new Map<CallbackHookKey, Callback>();

const getHooks = (hookName: string): Callback[] => hooks[hookName] || [];

export class Callbacks {
	/*
	* Callback priorities
	* @enum {CallbackPriority}
	*/
	static priority = {
		HIGH: -1000,
		MEDIUM: 0,
		LOW: 1000,
	};

	/*
	* Add a callback function to a hook
	* @param {String} hook - The name of the hook
	* @param {Function} callback - The callback function
	* @param {CallbackPriority} priority - The callback run priority (order)
	* @param {String} id - Human friendly name for this callback
	*/
	public static add<T extends CallbackHookKey>(
		hook: T,
		callback: Callback<T>,
		priority: Priority = Callbacks.priority.MEDIUM,
		id = Random.id(),
	): void {
		hooks[hook] = getHooks(hook);
		if (hooks[hook].find((cb): boolean => {
			const callbackMeta = meta.get(cb);
			return callbackMeta?.id === id;
		})) {
			return;
		}

		meta.set(callback, { hook, priority, id, stack: new Error().stack });

		hooks[hook].push(callback);
		hooks[hook] = _.sortBy(hooks[hook], (callback) => {
			const callbackMeta = meta.get(callback);
			callbackMeta?.priority || Callbacks.priority.MEDIUM;
		});
		combinedCallbacks.set(hook, create(hook, hooks[hook]));
	}

	/*
	* Remove a callback from a hook
	* @param {string} hook - The name of the hook
	* @param {string} id - The callback's id
	*/

	public static remove<T extends CallbackHookKey>(hook: T, id: string): void {
		hooks[hook] = getHooks(hook).filter((callback): boolean => {
			const callbackMeta = meta.get(callback);
			return callbackMeta?.id !== id;
		});
		combinedCallbacks.set(hook, create(hook, hooks[hook]));
	}

	/*
	* Successively run all of a hook's callbacks on an item
	* @param {String} hook - The name of the hook
	* @param {Object} item - The post, comment, modifier, etc. on which to run the callbacks
	* @param {Object} [constant] - An optional constant that will be passed along to each callback
	* @returns {Object} Returns the item after it's been through all the callbacks for this hook
	*/
	public static run<H extends CallbackHookKey>(hook: H, item: CallbackHookPayload<H>['args'], ...[constant]: CallbackConstant<ArgumentTypes<Callback>[1]>): CallbackHookPayload<H>['result'] {
		const runner = combinedCallbacks.get(hook);
		if (!runner) {
			return item;
		}

		return runner(item, constant);
	}

	public static runItem({ callback, result, constant /* , hook */ }: { callback: Callback; result: ArgumentTypes<Callback>[0]; constant: ArgumentTypes<Callback>[1] }): ArgumentTypes<Callback>[0] {
		return callback(result, constant);
	}

	/*
	* Successively run all of a hook's callbacks on an item, in async mode (only works on server)
	* @param {String} hook - The name of the hook
	* @param {Object} item - The post, comment, modifier, etc. on which to run the callbacks
	* @param {Object} [constant] - An optional constant that will be passed along to each callback
	*/

	public static runAsync<H extends CallbackHookKey, C = CallbackHookPayload<H>['constant']>(hook: H, item: CallbackHookPayload<H>['args'], ...[constant]: CallbackConstant<C>): CallbackHookPayload<H>['result'] {
		if (Meteor.isServer) {
			throw new Error('callbacks.runAsync on client server not allowed');
		}
		const callbackItems = hooks[hook];
		if (callbackItems && callbackItems.length) {
			callbackItems.forEach((callback) => Meteor.defer(function() { callback(item, constant as ArgumentTypes<Callback>[1]); }));
		}
		return item;
	}
}

// we should not be so permissive
const handleResult = (fn: Callback) => (result: ReturnType<Callback>, constant: ArgumentTypes<Callback>[1]): ReturnType<Callback> => {
	const cb = meta.get(fn);
	const callbackResult = cb && Callbacks.runItem({ callback: fn, result, constant });
	return typeof callbackResult === 'undefined' ? result : callbackResult;
};

const identity = <T extends unknown>(e: T): T => e;
const pipe = (f: Callback, g: Callback): Callback => (e, ...constants): unknown => g(f(e, ...constants), ...constants);

const createCallback = <H extends CallbackHookKey>(hook: H, callbacks: Callback[]): Callback => callbacks.map(handleResult).reduce(pipe, identity);

const createCallbackTimed = <H extends CallbackHookKey>(hook: H, callbacks: Callback[]): Callback =>
	wrapRun(hook,
		callbacks
			.map(wrapCallback)
			.map(handleResult)
			.reduce(pipe, identity),
	);
const create = <H extends CallbackHookKey>(hook: H, cbs: Callback[]): Callback =>
	(timed ? createCallbackTimed(hook, cbs) : createCallback(hook, cbs));
// interface ICallbackProps {
// 	'test': ICallbackPayloadsProps<{ a: number }>;
// }

// Callbacks.add('test', (args, c) => {
// 	console.log(c);
// 	return args;
// });

// const a = Callbacks.run('test', { a: 1 });

// console.log(a);


export const callbacks = Callbacks;

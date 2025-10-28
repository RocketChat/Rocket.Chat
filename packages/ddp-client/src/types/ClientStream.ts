import type { Emitter } from '@rocket.chat/emitter';

import type { DDPDispatchOptions } from '../MinimalDDPClient';
import type { Subscription } from './Subscription';
import type { PublicationPayloads } from './publicationPayloads';

export interface ClientStream extends Emitter {
	/**
	 * Calls a method on the server.
	 * @param method - The name of the method to be called.
	 * @param params - The parameters to be passed to the method.
	 * @param params.lastArgument - The last argument can be a callback function, the first argument of the callback function is the error, the second argument is the result.
	 *
	 * @returns {string} - The id of the method call.
	 */
	call(method: string, ...params: any[]): string;

	/**
	 * Calls a method on the server. The same as `call` but with options.
	 * This options are passed to the dispatcher. The dispatcher is responsible for handling the method call.
	 * So depending on the dispatcher, the options may or may not be used. By default, the dispatcher only uses the `wait` option.
	 * One reason to use options is to make the call wait for the result to dispatch other calls.
	 * Mainly for authentication purposes.
	 *
	 * @param method - The name of the method to be called.
	 * @param options - The options to be passed to the method.
	 * @param options.wait - If true, the call will wait for the result to dispatch other calls.
	 * @param params - The parameters to be passed to the method.
	 * @param params.lastArgument - The last argument can be a callback function, the first argument of the callback function is the error, the second argument is the result.
	 * @returns {string} - The id of the method call.
	 **/
	callWithOptions(method: string, options: DDPDispatchOptions, ...params: any[]): string;

	/**
	 * Calls a method on the server. The same as `call` but returns a promise.
	 * @param method - The name of the method to be called.
	 * @param params - The parameters to be passed to the method.
	 * @returns {Promise} - A promise that resolves when the server returns the result.
	 * @example
	 * ```ts
	 * const result = await ddp.callAsync('login', {
	 * 	user: {
	 * 		username: 'my-username',
	 * 		password: 'my-password',
	 * 	},
	 * });
	 * ```
	 */
	callAsync(
		method: string,
		...params: any[]
	): Promise<any> & {
		id: string;
	};

	/**
	 * Calls a method on the server. The same as `callWithOptions` but returns a promise.
	 * @param method - The name of the method to be called.
	 * @param options - The options to be passed to the method.
	 * @param options.wait - If true, the call will wait for the result to dispatch other calls.
	 * @param params - The parameters to be passed to the method.
	 * @returns {Promise} - A promise that resolves when the server returns the result.
	 */
	callAsyncWithOptions(
		method: string,
		options: DDPDispatchOptions,
		...params: any[]
	): Promise<any> & {
		id: string;
	};

	/**
	 * Subscribes to a publication on the server.
	 * @param name - The name of the publication to subscribe to.
	 * @param params - The parameters to be passed to the publication.
	 * @returns {Promise} - A promise that resolves when the server returns the subscription id.
	 */
	subscribe(name: string, ...params: any[]): Subscription;
	/**
	 * Unsubscribes from a publication on the server.
	 * @param id - The id of the subscription to unsubscribe from.
	 * @returns {Promise} - A promise that resolves when the server unsubscribes the subscription.
	 */
	unsubscribe(id: string): Promise<any>;
	/**
	 * Connects to the server.
	 * @returns {Promise} - A promise that resolves when the server connects.
	 * @example
	 * ```ts
	 * await ddp.connect();
	 * ```
	 */
	connect(): Promise<any>;
	/**
	 * Fired when the server send any collection update.
	 * usually this used after subscribing to a publication.
	 * @param id - The id/name of the collection.
	 * @param callback - The callback function to be called when the server sends any collection update.
	 * @returns {Function} - A function to stop listening for collection updates.
	 * @example
	 * ```ts
	 * const stop = ddp.onCollection('users', (data) => {
	 * 	console.log(data);
	 * });
	 * ```
	 */
	onCollection(id: string, callback: (data: PublicationPayloads) => void): () => void;

	/**
	 * The list of subscriptions.
	 * @type {Map<string, { id: string; status: 'ready' | 'loading'; name: string; params: any[]; }>}
	 * @example
	 * ```ts
	 * const subscription = ddp.subscribe('my-subscription');
	 * console.log(ddp.subscriptions.get(subscription.id));
	 * // prints:
	 * // {
	 * //	id: 'my-subscription',
	 * //	status: 'loading',
	 * //	name: 'my-subscription',
	 * //	params: [],
	 * // }
	 * ```
	 */
	subscriptions: Map<string, Subscription>;
}

/* eslint-disable @typescript-eslint/naming-convention */
import { Meteor } from 'meteor/meteor';
import { Promise } from 'meteor/promise';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Tracker } from 'meteor/tracker';

import type { Current } from './router';
import type { Trigger } from './triggers';

declare module 'meteor/reactive-dict' {
	export interface ReactiveDict {
		keyDeps: Record<string, Tracker.Dependency>;
	}
}

export type Context = {
	canonicalPath: string;
	hash: string;
	params: Record<string, string>;
	path: string;
	pathname: string;
	querystring: string;
	state: Record<string, string>;
	title: string;
};

export type RouteOptions = {
	name?: string;
	whileWaiting?: Hook;
	waitOn?: waitOn;
	waitOnResources?: waitOnResources;
	endWaiting?: () => void;
	data?: data;
	onNoData?: Hook;
	triggersEnter?: Array<Trigger>;
	action?: action;
	triggersExit?: Array<Trigger>;
	conf?: { forceReRender?: boolean };
	waitFor?: waitOn[];
	subscriptions?: (this: Route, params?: Record<string, string>, queryParams?: Record<string, string>) => void;
};

export type Hook = (params: Record<string, string>, qs: Record<string, string>) => void | Promise<void>;

type DynamicImport = Promise<string>;

export type waitOn = (
	params: Record<string, string>,
	qs: Record<string, string>,
	ready: (func: () => ReturnType<waitOn>) => void,
) =>
	| Promise<any>
	| Array<Promise<any>>
	| Meteor.SubscriptionHandle
	| Tracker.Computation
	| Array<Tracker.Computation>
	| DynamicImport
	| Array<DynamicImport | Meteor.SubscriptionHandle>;

export type waitOnResources = (
	params: Record<string, string>,
	qs: Record<string, string>,
	data?: unknown,
) => {
	images: string[];
	other: string[];
};

export type data = (
	params: Record<string, string>,
	qs: Record<string, string>,
) => Mongo.CursorStatic | object | object[] | false | null | void | Promise<Mongo.CursorStatic | object | object[] | false | null | void>;

export type action = (params: Record<string, string>, qs: Record<string, string>, data: unknown) => void | Promise<void>;

const makeTriggers = (triggers: Trigger | Trigger[]) => {
	if (typeof triggers === 'function') {
		return [triggers];
	}
	if (!Array.isArray(triggers)) {
		return [];
	}

	return triggers;
};

class Route {
	readonly options: RouteOptions;

	readonly pathDef: string | undefined;

	private readonly _data: data | null;

	private readonly _action: action;

	private readonly _waitOn: waitOn | null;

	private readonly _waitFor: waitOn[];

	private _onNoData: Hook | null;

	private _endWaiting: (() => void) | null;

	private _currentData: unknown;

	_triggersExit: Trigger[];

	private _whileWaiting: Hook | null;

	_triggersEnter: Trigger[];

	private _subscriptions: (this: Route, params?: Record<string, string>, queryParams?: Record<string, string>) => void;

	private _waitOnResources: waitOnResources | null;

	private _params: ReactiveDict<Record<string, string>>;

	private _queryParams: ReactiveDict<Record<string, string>>;

	private _routeCloseDep: Tracker.Dependency;

	private _pathChangeDep: Tracker.Dependency;

	name: string | undefined;

	constructor(pathDef?: string, options: RouteOptions = {}) {
		this.options = options;
		this.pathDef = pathDef;

		this._data = options.data || null;
		this._action = options.action || (() => undefined);
		this._waitOn = options.waitOn || null;
		this._waitFor = Array.isArray(options.waitFor) ? options.waitFor : [];
		this._onNoData = options.onNoData || null;
		this._endWaiting = options.endWaiting || null;
		this._currentData = null;
		this._triggersExit = options.triggersExit ? makeTriggers(options.triggersExit) : [];
		this._whileWaiting = options.whileWaiting || null;
		this._triggersEnter = options.triggersEnter ? makeTriggers(options.triggersEnter) : [];
		this._subscriptions = options.subscriptions || (() => undefined);
		this._waitOnResources = options.waitOnResources || null;

		this._params = new ReactiveDict();
		this._queryParams = new ReactiveDict();
		this._routeCloseDep = new Tracker.Dependency();
		this._pathChangeDep = new Tracker.Dependency();

		if (options.name) {
			this.name = options.name;
		}
	}

	private checkSubscriptions(subscriptions: Meteor.SubscriptionHandle[]) {
		const results = [];
		for (let i = 0; i < subscriptions.length; i++) {
			results.push(subscriptions[i]?.ready?.() ?? false);
		}

		return !results.includes(false);
	}

	async waitOn(current: Current = {}, next: (current: Current, data?: unknown) => void) {
		let _data: unknown = null;
		let _isWaiting = false;
		let _preloaded = 0;
		let _resources: waitOnResources[] | false = false;
		let waitFor: waitOn[] = [];
		let promises: PromiseLike<unknown>[] = [];
		let subscriptions: Meteor.SubscriptionHandle[] = [];
		let timer: number;
		let trackers: Tracker.Computation[] = [];

		const placeIn = (d: Promise<unknown> | PromiseLike<unknown> | Tracker.Computation | Meteor.SubscriptionHandle) => {
			if (d instanceof Promise || typeof (d as { then?: unknown }).then === 'function') {
				promises.push(d as PromiseLike<unknown>);
			} else if ((d as { flush?: unknown }).flush) {
				trackers.push(d as Tracker.Computation);
			} else if ((d as Meteor.SubscriptionHandle).ready) {
				subscriptions.push(d as Meteor.SubscriptionHandle);
			}
		};

		const whileWaitingAction = () => {
			if (!_isWaiting) {
				this._whileWaiting?.(current.params!, current.queryParams!);
				_isWaiting = true;
			}
		};

		const subWait = (delay: number) => {
			timer = Meteor.setTimeout(async () => {
				if (this.checkSubscriptions(subscriptions)) {
					Meteor.clearTimeout(timer);
					_data = await getData();
					if (_resources) {
						whileWaitingAction();
						getResources();
					} else {
						next(current, _data);
					}
				} else {
					wait(24);
				}
			}, delay);
		};

		let waitFails = 0;
		const wait = (delay: number) => {
			if (promises.length) {
				Promise.all(promises)
					.then(() => {
						subWait(delay);
						promises = [];
					})
					.catch((error) => {
						if (waitFails > 9) {
							subWait(256);
							waitFails = 0;
							promises = [];
						} else {
							wait(128);
							waitFails++;
							Meteor._debug('[ostrio:flow-router-extra] [route.wait] Promise not resolved', error);
						}
					});
			} else {
				subWait(delay);
			}
		};

		const processSubData = (subData: ReturnType<waitOn>) => {
			if (subData instanceof Array) {
				for (let i = subData.length - 1; i >= 0; i--) {
					if (subData[i] !== null && typeof subData[i] === 'object') {
						placeIn(subData[i]);
					}
				}
			} else if (subData !== null && typeof subData === 'object') {
				placeIn(subData);
			}
		};

		const stopSubs = () => {
			for (let i = subscriptions.length - 1; i >= 0; i--) {
				subscriptions[i].stop?.();
				delete subscriptions[i];
			}
			subscriptions = [];
		};

		const done = (subscription: () => ReturnType<waitOn>) => {
			processSubData(typeof subscription === 'function' ? subscription() : subscription);
		};

		if (this._waitOnResources) {
			if (!_resources) {
				_resources = [];
			}
			_resources.push(this._waitOnResources);
		}

		const preload = (len: number, __data: unknown) => {
			_preloaded++;
			if (_preloaded >= len) {
				next(current, __data);
			}
		};

		const getData = async () => {
			if (this._data) {
				if (!_data) {
					// eslint-disable-next-line no-multi-assign
					_data = this._currentData = await this._data(current.params!, current.queryParams!);
				} else {
					_data = this._currentData;
				}
			}
			return _data;
		};

		const getResources = async () => {
			_data = await getData();
			let len = 0;
			let items;
			let images: string[] = [];
			let other: string[] = [];
			for (let i = (_resources as waitOnResources[]).length - 1; i >= 0; i--) {
				items = (_resources as waitOnResources[])[i].call(this, current.params!, current.queryParams!, _data);
				if (items) {
					if (items.images?.length) {
						images = images.concat(items.images);
					}
					if (items.other?.length) {
						other = other.concat(items.other);
					}
				}
			}

			if (other?.length || images?.length) {
				if (other?.length && typeof XMLHttpRequest !== 'undefined') {
					other = other.filter((elem, index, self) => {
						return index === self.indexOf(elem);
					});
					len += other.length;
					const prefetch: Record<number, XMLHttpRequest> = {};
					for (let k = other.length - 1; k >= 0; k--) {
						prefetch[k] = new XMLHttpRequest();
						// eslint-disable-next-line no-loop-func
						prefetch[k].onload = () => {
							preload(len, _data);
						};
						// eslint-disable-next-line no-loop-func
						prefetch[k].onerror = () => {
							preload(len, _data);
						};
						prefetch[k].open('GET', other[k]);
						prefetch[k].send(null);
					}
				}

				if (images?.length) {
					images = images.filter((elem, index, self) => {
						return index === self.indexOf(elem);
					});
					len += images.length;
					const imgs: Record<number, HTMLImageElement> = {};
					for (let j = images.length - 1; j >= 0; j--) {
						imgs[j] = new Image();
						// eslint-disable-next-line no-loop-func
						imgs[j].onload = () => {
							preload(len, _data);
						};
						// eslint-disable-next-line no-loop-func
						imgs[j].onerror = () => {
							preload(len, _data);
						};
						imgs[j].src = images[j];
					}
				}
			} else {
				next(current, _data);
			}
		};

		if (this._waitFor.length) {
			waitFor = waitFor.concat(this._waitFor);
		}

		if (typeof this._waitOn === 'function') {
			waitFor.push(this._waitOn);
		}

		if (waitFor.length) {
			waitFor.forEach((wo) => {
				processSubData(wo.call(this, current.params!, current.queryParams!, done));
			});

			const triggerExitIndex = this._triggersExit.push(() => {
				stopSubs();
				for (let i = trackers.length - 1; i >= 0; i--) {
					trackers[i].stop?.();
					delete trackers[i];
				}
				trackers = [];
				promises = [];
				subscriptions = [];
				// eslint-disable-next-line no-multi-assign
				_data = this._currentData = null;
				this._triggersExit.splice(triggerExitIndex - 1, 1);
			});

			whileWaitingAction();
			wait(12);
		} else if (_resources) {
			whileWaitingAction();
			getResources();
		} else if (this._data) {
			next(current, await getData());
		} else {
			next(current);
		}
	}

	async callAction(current: Current) {
		this._endWaiting?.();
		if (this._data) {
			if (this._onNoData && !this._currentData) {
				await this._onNoData(current.params!, current.queryParams!);
			} else {
				await this._action(current.params!, current.queryParams!, this._currentData);
			}
		} else {
			await this._action(current.params!, current.queryParams!, this._currentData);
		}
	}

	callSubscriptions(current: Current) {
		this._subscriptions(current.params!, current.queryParams!);
	}

	watchPathChange() {
		this._pathChangeDep.depend();
	}

	registerRouteClose() {
		this._params = new ReactiveDict();
		this._queryParams = new ReactiveDict();
		this._routeCloseDep.changed();
		this._pathChangeDep.changed();
	}

	registerRouteChange(currentContext: Current, routeChanging: boolean) {
		// register params
		this._updateReactiveDict(this._params, currentContext.params!);

		// register query params
		this._updateReactiveDict(this._queryParams, currentContext.queryParams!);

		// if the route is changing, we need to defer triggering path changing
		// if we did this, old route's path watchers will detect this
		// Real issue is, above watcher will get removed with the new route
		// So, we don't need to trigger it now
		// We are doing it on the route close event. So, if they exists they'll
		// get notify that
		if (!routeChanging) {
			this._pathChangeDep.changed();
		}
	}

	private _updateReactiveDict(dict: ReactiveDict<Record<string, string>>, newValues: Record<string, string>) {
		const currentKeys = Object.keys(newValues);
		const oldKeys = Object.keys(dict.keyDeps);

		// set new values
		//  params is an array. So, currentKeys.forEach() does not works
		//  to iterate params
		currentKeys.forEach((key) => {
			dict.set(key, newValues[key]);
		});

		// remove keys which does not exisits here
		oldKeys
			.filter((i) => {
				return currentKeys.indexOf(i) < 0;
			})
			.forEach((key) => {
				dict.set(key, undefined);
			});
	}

	_actionHandle: PageJS.Callback;

	_exitHandle: PageJS.Callback;
}

export default Route;

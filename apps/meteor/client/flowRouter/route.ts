/* eslint-disable @typescript-eslint/naming-convention */
import { Meteor } from 'meteor/meteor';
import { Promise } from 'meteor/promise';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Tracker } from 'meteor/tracker';

import { isArray, isFunction } from './_helpers';
import type Group from './group';
import Router from './router';
import type { Trigger } from './triggers';

declare module 'meteor/reactive-dict' {
	export interface ReactiveDict {
		keyDeps: Record<string, Tracker.Dependency>;
	}
}

type Param = {
	[key: string]: string;
};

type QueryParam = Param;

export type Context = {
	canonicalPath: string;
	hash: string;
	params: Param;
	path: string;
	pathname: string;
	querystring: string;
	state: { [key: string]: string };
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
	waitFor?: (() => void)[];
	subscriptions?: (this: Route, params?: Record<string, string>, queryParams?: Record<string, string | string[]>) => void;
};

export type Hook = (params: Param, qs: QueryParam) => void | Promise<void>;

type DynamicImport = Promise<string>;

export type waitOn = (
	params: Param,
	qs: QueryParam,
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
	params: Param,
	qs: QueryParam,
) => {
	images: string[];
	other: string[];
};

export type data = (
	params: Param,
	qs: QueryParam,
) => Mongo.CursorStatic | object | object[] | false | null | void | Promise<Mongo.CursorStatic | object | object[] | false | null | void>;

export type action = (params: Param, qs: QueryParam, data: any) => void;

const makeTriggers = (triggers: any) => {
	if (isFunction(triggers)) {
		return [triggers];
	}
	if (!isArray(triggers)) {
		return [];
	}

	return triggers;
};

class Route {
	options: RouteOptions;

	pathDef: string | undefined;

	path: string | undefined;

	conf:
		| {
				[key: string]: any;
				forceReRender?: boolean;
		  }
		| undefined;

	group: Group | undefined;

	_data: data | null;

	_router: Router;

	_action: action;

	_waitOn: waitOn | null;

	_waitFor: Function[];

	_subsMap: Record<string, Meteor.SubscriptionHandle>;

	_onNoData: Hook | null;

	_endWaiting: (() => void) | null;

	_currentData: any;

	_triggersExit: Trigger[];

	_whileWaiting: Hook | null;

	_triggersEnter: Trigger[];

	_subscriptions: (this: Route, params?: Record<string, string>, queryParams?: Record<string, string | string[]>) => void;

	_waitOnResources: waitOnResources | null;

	_params: ReactiveDict;

	_queryParams: ReactiveDict;

	_routeCloseDep: Tracker.Dependency;

	_pathChangeDep: Tracker.Dependency;

	name: string | undefined;

	constructor(router = new Router(), pathDef?: string, options: RouteOptions = {}, group?: Group) {
		this.options = options;
		this.pathDef = pathDef;

		// Route.path is deprecated and will be removed in 3.0
		this.path = pathDef;
		this.conf = options.conf || {};
		this.group = group;
		this._data = options.data || null;
		this._router = router;
		this._action = options.action || (() => undefined);
		this._waitOn = options.waitOn || null;
		this._waitFor = isArray(options.waitFor) ? options.waitFor : [];
		this._subsMap = {};
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

	clearSubscriptions() {
		this._subsMap = {};
	}

	register(name: any, sub: any) {
		this._subsMap[name] = sub;
	}

	getSubscription(name: any) {
		return this._subsMap[name];
	}

	getAllSubscriptions() {
		return this._subsMap;
	}

	checkSubscriptions(subscriptions: any) {
		const results = [];
		for (let i = 0; i < subscriptions.length; i++) {
			results.push(subscriptions[i] && subscriptions[i].ready ? subscriptions[i].ready() : false);
		}

		return !results.includes(false);
	}

	async waitOn(current: any = {}, next: any) {
		let _data: any = null;
		let _isWaiting = false;
		let _preloaded = 0;
		let _resources: any = false;
		let waitFor: any[] = [];
		let promises: any = [];
		let subscriptions: any = [];
		let timer: any;
		let trackers: any = [];

		const placeIn = (d: any) => {
			if (
				Object.prototype.toString.call(d) === '[object Promise]' ||
				(d.then && Object.prototype.toString.call(d.then) === '[object Function]')
			) {
				promises.push(d);
			} else if (d.flush) {
				trackers.push(d);
			} else if (d.ready) {
				subscriptions.push(d);
			}
		};

		const whileWaitingAction = () => {
			if (!_isWaiting) {
				this._whileWaiting?.(current.params, current.queryParams);
				_isWaiting = true;
			}
		};

		const subWait = (delay: any) => {
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
		const wait = (delay: any) => {
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

		const processSubData = (subData: any) => {
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
				if (subscriptions[i].stop) {
					subscriptions[i].stop();
				}
				delete subscriptions[i];
			}
			subscriptions = [];
		};

		const done = (subscription: any) => {
			processSubData(isFunction(subscription) ? subscription() : subscription);
		};

		if (this._waitOnResources) {
			if (!_resources) {
				_resources = [];
			}
			_resources.push(this._waitOnResources);
		}

		const preload = (len: any, __data: any) => {
			_preloaded++;
			if (_preloaded >= len) {
				next(current, __data);
			}
		};

		const getData = async () => {
			if (this._data) {
				if (!_data) {
					// eslint-disable-next-line no-multi-assign
					_data = this._currentData = await this._data(current.params, current.queryParams);
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
			let images: any = [];
			let other: any = [];
			for (let i = _resources.length - 1; i >= 0; i--) {
				items = _resources[i].call(this, current.params, current.queryParams, _data);
				if (items) {
					if (items.images && items.images.length) {
						images = images.concat(items.images);
					}
					if (items.other && items.other.length) {
						other = other.concat(items.other);
					}
				}
			}

			if ((other && other.length) || (images && images.length)) {
				if (other && other.length && typeof XMLHttpRequest !== 'undefined') {
					other = other.filter((elem: any, index: any, self: any) => {
						return index === self.indexOf(elem);
					});
					len += other.length;
					const prefetch: any = {};
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
					images = images.filter((elem: any, index: any, self: any) => {
						return index === self.indexOf(elem);
					});
					len += images.length;
					const imgs: any = {};
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

		if (isFunction(this._waitOn)) {
			waitFor.push(this._waitOn);
		}

		if (waitFor.length) {
			waitFor.forEach((wo) => {
				processSubData(wo.call(this, current.params, current.queryParams, done));
			});

			const triggerExitIndex = this._triggersExit.push(() => {
				stopSubs();
				for (let i = trackers.length - 1; i >= 0; i--) {
					if (trackers[i].stop) {
						trackers[i].stop();
					}
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

	async callAction(current: any) {
		this._endWaiting?.();
		if (this._data) {
			if (this._onNoData && !this._currentData) {
				await this._onNoData(current.params, current.queryParams);
			} else {
				await this._action(current.params, current.queryParams, this._currentData);
			}
		} else {
			await this._action(current.params, current.queryParams, this._currentData);
		}
	}

	callSubscriptions(current: any) {
		this.clearSubscriptions();
		this.group?.callSubscriptions(current);
		this._subscriptions(current.params, current.queryParams);
	}

	getRouteName() {
		this._routeCloseDep.depend();
		return this.name;
	}

	getParam(key: any) {
		this._routeCloseDep.depend();
		return this._params.get(key);
	}

	getQueryParam(key: any) {
		this._routeCloseDep.depend();
		return this._queryParams.get(key);
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

	registerRouteChange(currentContext: any, routeChanging: any) {
		// register params
		this._updateReactiveDict(this._params, currentContext.params);

		// register query params
		this._updateReactiveDict(this._queryParams, currentContext.queryParams);

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

	_updateReactiveDict(dict: ReactiveDict, newValues: any) {
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

	declare _actionHandle: PageJS.Callback;

	declare _exitHandle: PageJS.Callback;
}

export default Route;

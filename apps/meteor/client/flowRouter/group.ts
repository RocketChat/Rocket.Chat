import { _helpers } from './_helpers';
import type { RouteOptions } from './route';
import type Route from './route';
import type Router from './router';

export type GroupOptions = { name?: string; prefix?: string; [key: string]: any };

const makeTrigger = (trigger: unknown) => {
	if (_helpers.isFunction(trigger)) {
		return [trigger];
	}
	if (!_helpers.isArray(trigger)) {
		return [];
	}

	return trigger;
};

const makeWaitFor = (func: unknown) => {
	if (_helpers.isFunction(func)) {
		return [func];
	}

	return [];
};

const makeTriggers = (_base: unknown, _triggers: unknown) => {
	if (!_base && !_triggers) {
		return [];
	}
	return makeTrigger(_base).concat(makeTrigger(_triggers));
};

class Group {
	_waitFor: Function[];

	_router: Router;

	prefix: string;

	name: string | undefined;

	options: GroupOptions;

	_triggersEnter: Function[];

	_triggersExit: Function[];

	_subscriptions: any;

	parent: Group | undefined;

	constructor(router: Router, options: GroupOptions = {}, parent?: Group) {
		if (options.prefix && !/^\//.test(options.prefix)) {
			throw new Error('group\'s prefix must start with "/"');
		}

		this._waitFor = makeWaitFor(options.waitOn);
		this._router = router;
		this.prefix = options.prefix || '';
		this.name = options.name;
		this.options = options;

		this._triggersEnter = makeTriggers(options.triggersEnter, this._triggersEnter);
		this._triggersExit = makeTriggers(this._triggersExit, options.triggersExit);

		this._subscriptions = options.subscriptions || Function.prototype;

		this.parent = parent;
		if (parent) {
			this.prefix = parent.prefix + this.prefix;
			this._triggersEnter = makeTriggers(parent._triggersEnter, this._triggersEnter);
			this._triggersExit = makeTriggers(this._triggersExit, parent._triggersExit);
			this._waitFor = parent._waitFor.concat(this._waitFor);
		}
	}

	route(_pathDef: string, options: RouteOptions = {}, _group?: Group) {
		if (!/^\//.test(_pathDef)) {
			throw new Error('route\'s path must start with "/"');
		}

		const group = _group || this;
		const pathDef = this.prefix + _pathDef;

		options.triggersEnter = makeTriggers(this._triggersEnter, options.triggersEnter);
		options.triggersExit = makeTriggers(options.triggersExit, this._triggersExit);
		options.waitFor = this._waitFor.concat([]);
		return this._router.route(
			pathDef,
			_helpers.extend(
				_helpers.omit(this.options, [
					'triggersEnter',
					'triggersExit',
					'subscriptions',
					'prefix',
					'waitOn',
					'name',
					'title',
					'titlePrefix',
					'link',
					'script',
					'meta',
				]),
				options,
			),
			group,
		);
	}

	group(options: GroupOptions) {
		return new Group(this._router, options, this);
	}

	callSubscriptions(current: { route: Route; params: Record<string, string>; queryParams?: Record<string, string> }) {
		if (this.parent) {
			this.parent.callSubscriptions(current);
		}

		this._subscriptions.call(current.route, current.params, current.queryParams);
	}
}

export default Group;

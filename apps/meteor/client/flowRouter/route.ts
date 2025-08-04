import { Tracker } from 'meteor/tracker';

import type { Current } from './router';

export type RouteOptions = {
	name?: string;
	action?: action;
};

type action = (params: Record<string, string>, qs: Record<string, string>, data: unknown) => void | Promise<void>;

class Route {
	readonly options: RouteOptions;

	readonly pathDef: string;

	private readonly _action: action;

	private _pathChangeDep: Tracker.Dependency;

	readonly name: string | undefined;

	constructor(pathDef: string, options: RouteOptions = {}) {
		this.options = options;
		this.pathDef = pathDef;
		this._action = options.action ?? (() => undefined);
		this._pathChangeDep = new Tracker.Dependency();
		this.name = options.name;
	}

	async callAction(current: Current) {
		await this._action(current.params, current.queryParams, null);
	}

	watchPathChange() {
		this._pathChangeDep.depend();
	}

	registerRouteClose() {
		this._pathChangeDep.changed();
	}

	registerRouteChange(_: Current, routeChanging: boolean) {
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

	_actionHandle: PageJS.Callback;

	_exitHandle: PageJS.Callback;
}

export default Route;

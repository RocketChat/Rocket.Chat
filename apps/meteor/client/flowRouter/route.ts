import { Tracker } from 'meteor/tracker';

import type { Callback } from './page';
import type { Current } from './router';

export type RouteOptions = {
	name?: string;
	action?: () => void;
};

class Route {
	readonly options: RouteOptions;

	readonly pathDef: string;

	private readonly _action: () => void | Promise<void>;

	private _pathChangeDep: Tracker.Dependency;

	readonly name: string | undefined;

	constructor(pathDef: string, options: RouteOptions = {}) {
		this.options = options;
		this.pathDef = pathDef;
		this._action = options.action ?? (() => undefined);
		this._pathChangeDep = new Tracker.Dependency();
		this.name = options.name;
	}

	async callAction() {
		await this._action();
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

	_actionHandle: Callback;
}

export default Route;

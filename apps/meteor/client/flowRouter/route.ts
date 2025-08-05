import { Tracker } from 'meteor/tracker';

import type { Callback } from './page';
import type { Current } from './router';

export type RouteOptions = {
	name?: string;
	action?: () => void;
};

class Route {
	private _pathChangeDep = new Tracker.Dependency();

	private readonly _action: () => void | Promise<void>;

	readonly name: string | undefined;

	constructor(
		public readonly pathDef: string,
		public readonly options: RouteOptions = {},
	) {
		this._action = options.action ?? (() => undefined);
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

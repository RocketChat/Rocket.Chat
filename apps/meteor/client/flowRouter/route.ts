import { Tracker } from 'meteor/tracker';

import type { Callback } from './page';

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

	registerRouteChange(routeChanging: boolean) {
		if (!routeChanging) {
			this._pathChangeDep.changed();
		}
	}

	_actionHandle: Callback;
}

export default Route;

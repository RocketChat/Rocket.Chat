import type { Callback } from './page';

export type RouteOptions = {
	name?: string;
	action?: () => void;
};

class Route {
	readonly action: () => void | Promise<void>;

	readonly name: string | undefined;

	constructor(
		public readonly pathDef: string,
		public readonly options: RouteOptions = {},
	) {
		this.action = options.action ?? (() => undefined);
		this.name = options.name;
	}

	_actionHandle: Callback;
}

export default Route;

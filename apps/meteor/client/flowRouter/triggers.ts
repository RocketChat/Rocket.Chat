// a set of utility functions for triggers

import type Router from './router';

export type Trigger = (context: ReturnType<Router['current']>, redirect: Router['go'], stop?: () => void, data?: unknown) => void;

const Triggers = {
	// Apply filters for a set of triggers
	// @triggers - a set of triggers
	// @filter - filter with array fields with `only` and `except`
	//           support only either `only` or `except`, but not both
	applyFilters: (_triggers: Trigger[], filter?: { only?: string[]; except?: string[] }) => {
		let triggers = _triggers;
		if (!(triggers instanceof Array)) {
			triggers = [triggers];
		}

		if (!filter) {
			return triggers;
		}

		if (filter.only && filter.except) {
			throw new Error("Triggers don't support only and except filters at once");
		}

		if (filter.only && !(filter.only instanceof Array)) {
			throw new Error('only filters needs to be an array');
		}

		if (filter.except && !(filter.except instanceof Array)) {
			throw new Error('except filters needs to be an array');
		}

		if (filter.only) {
			return Triggers.createRouteBoundTriggers(triggers, filter.only);
		}

		if (filter.except) {
			return Triggers.createRouteBoundTriggers(triggers, filter.except, true);
		}

		throw new Error('Provided a filter but not supported');
	},

	//  create triggers by bounding them to a set of route names
	//  @triggers - a set of triggers
	//  @names - list of route names to be bound (trigger runs only for these names)
	//  @negate - negate the result (triggers won't run for above names)
	createRouteBoundTriggers: (triggers: Trigger[], names: string[], negate?: boolean) => {
		const namesMap: Record<string, boolean> = {};
		for (const name of names) {
			namesMap[name] = true;
		}

		const filteredTriggers = triggers.map((originalTrigger) => {
			const modifiedTrigger = (context: ReturnType<Router['current']>, next: Router['go']) => {
				let matched = namesMap[context.route!.name!] ? 1 : -1;
				matched = negate ? matched * -1 : matched;

				if (matched === 1) {
					originalTrigger(context, next);
				}
			};
			return modifiedTrigger;
		});

		return filteredTriggers;
	},

	//  run triggers and abort if redirected or callback stopped
	//  @triggers - a set of triggers
	//  @context - context we need to pass (it must have the route)
	//  @redirectFn - function which used to redirect
	//  @after - called after if only all the triggers runs
	runTriggers: (
		triggers: Trigger[],
		context: ReturnType<Router['current']>,
		redirectFn: Router['go'],
		after: () => void,
		data?: unknown,
	) => {
		let abort = false;
		let inCurrentLoop = true;
		let alreadyRedirected = false;

		const doRedirect = (url: string, params?: Record<string, string>, queryParams?: Record<string, string>) => {
			if (alreadyRedirected) {
				throw new Error('already redirected');
			}

			if (!inCurrentLoop) {
				throw new Error('redirect needs to be done in sync');
			}

			if (!url) {
				throw new Error('trigger redirect requires an URL');
			}

			abort = true;
			alreadyRedirected = true;
			redirectFn(url, params, queryParams);
		};

		const doStop = () => {
			abort = true;
		};

		for (let lc = 0; lc < triggers.length; lc++) {
			triggers[lc](context, doRedirect, doStop, data);

			if (abort) {
				return;
			}
		}

		// mark that, we've exceeds the currentEventloop for
		// this set of triggers.
		inCurrentLoop = false;
		after();
	},
};

export default Triggers;

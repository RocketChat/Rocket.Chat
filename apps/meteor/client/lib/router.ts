import { FlowRouter } from 'meteor/kadira:flow-router';

type Pathname = string;
type Search = string;
type Hash = string;

// eslint-disable-next-line @typescript-eslint/naming-convention
interface Path {
	pathname: Pathname;
	search: Search;
	hash: Hash;
}

type To = string | Partial<Path>;

type RelativeRoutingType = 'route' | 'path';

export function navigate(
	to: To,
	options?: {
		replace?: boolean;
		state?: any;
		relative?: RelativeRoutingType;
	},
): void;
export function navigate(delta: number): void;
export function navigate(
	toOrDelta: To | number,
	options?: {
		replace?: boolean;
		state?: any;
	},
) {
	if (typeof toOrDelta === 'number') {
		window.history.go(toOrDelta);
		return;
	}

	if (typeof toOrDelta === 'string') {
		navigate({ pathname: toOrDelta }, options);
		return;
	}

	const {
		pathname = FlowRouter.current().path,
		search = new URLSearchParams(FlowRouter.current().queryParams).toString(),
		hash,
	} = toOrDelta;
	const { replace } = options || {};

	const pathDef = pathname ?? FlowRouter.current().path;
	const queryParams = search ? Object.fromEntries(new URLSearchParams(search).entries()) : FlowRouter.current().queryParams;

	const fn = () => {
		FlowRouter.go(pathDef, undefined, queryParams);
		if (hash) location.hash = hash;
	};

	if (replace) {
		FlowRouter.withReplaceState(fn);
		return;
	}

	fn();
}

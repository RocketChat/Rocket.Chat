import Router from './router';

// type Trigger = (context: ReturnType<Router['current']>, redirect: Router['go'], stop: () => void, data: any) => void;

// type TriggerFilterParam = { only: string[] } | { except: string[] };

// type DynamicImport = Promise<string>;

// type Hook = (params: Param, qs: QueryParam) => void | Promise<void>;

// type waitOn = (
// 	params: Param,
// 	qs: QueryParam,
// 	ready: (func: () => ReturnType<waitOn>) => void,
// ) =>
// 	| Promise<any>
// 	| Array<Promise<any>>
// 	| Meteor.SubscriptionHandle
// 	| Tracker.Computation
// 	| Array<Tracker.Computation>
// 	| DynamicImport
// 	| Array<DynamicImport | Meteor.SubscriptionHandle>;

// type waitOnResources = (
// 	params: Param,
// 	qs: QueryParam,
// ) => {
// 	images: string[];
// 	other: string[];
// };

// type data = (
// 	params: Param,
// 	qs: QueryParam,
// ) => Mongo.CursorStatic | object | object[] | false | null | void | Promise<Mongo.CursorStatic | object | object[] | false | null | void>;

// type action = (params: Param, qs: QueryParam, data: any) => void;

// type Param = {
// 	[key: string]: string;
// };

// type NewParams = {
// 	[key: string]: string | null;
// };

// type QueryParam = Param;

// interface Router {
// 	go: (path: string, params?: NewParams, qs?: NewParams) => boolean;
// 	route: (
// 		path: string,
// 		options?: {
// 			name?: string;
// 			whileWaiting?: Hook;
// 			waitOn?: waitOn;
// 			waitOnResources?: waitOnResources;
// 			endWaiting?: () => void;
// 			data?: data;
// 			onNoData?: Hook;
// 			triggersEnter?: Array<Trigger>;
// 			action?: action;
// 			triggersExit?: Array<Trigger>;
// 			conf?: { [key: string]: any; forceReRender?: boolean };
// 			[key: string]: any;
// 		},
// 	) => Route;
// 	group: (options: { name: string; prefix?: string; [key: string]: any }) => any;
// 	render: (layout: string, template: string, data?: { [key: string]: any }, callback?: () => void) => void;

// 	refresh: (layout: string, template: string) => void;
// 	reload: () => void;
// 	redirect: (path: string) => void;
// 	pathRegExp: RegExp;
// 	decodeQueryParamsOnce: boolean;

// 	getParam: (param: string) => string;
// 	getQueryParam: (param: string) => string;
// 	setParams: (params: NewParams) => boolean;
// 	setQueryParams: (params: NewParams) => boolean;

// 	url: (path: string, params?: NewParams, qs?: NewParams) => string;
// 	path: (path: string, params?: NewParams, qs?: NewParams) => string;
// 	current: () => {
// 		context: Context;
// 		oldRoute: Route;
// 		params: Param;
// 		path: string;
// 		queryParams: QueryParam;
// 		route: Route;
// 	};
// 	getRouteName: () => string;

// 	watchPathChange: () => void;
// 	withReplaceState: (callback: () => void) => void;

// 	onRouteRegister: (callback: (route: Route) => void) => void;

// 	wait: () => void;
// 	initialize: (options: { hashbang: boolean; page: { click: boolean } }) => void;

// 	triggers: {
// 		enter: (triggers: Trigger[], filter?: TriggerFilterParam) => void;
// 		exit: (triggers: Trigger[], filter?: TriggerFilterParam) => void;
// 	};
// }

// interface Route {
// 	conf: { [key: string]: string | boolean };
// 	globals: Array<any>;
// 	group: string;
// 	name: string;
// 	options: { name: string };
// 	path: string;
// 	pathDef: string;
// 	render: () => void;
// }

// type Context = {
// 	canonicalPath: string;
// 	hash: string;
// 	params: Param;
// 	path: string;
// 	pathname: string;
// 	querystring: string;
// 	state: { [key: string]: string };
// 	title: string;
// };

// interface Helpers {
// 	name: (routeName: string | RegExp) => boolean;
// 	path: (pathName: string | RegExp) => boolean;
// 	pathFor: (pathName: string, params: Param) => string;
// 	configure: (options: { activeClass: string; caseSensitive: boolean; disabledClass: string; regex: string }) => void;
// }

const FlowRouter = new Router();

export { FlowRouter };

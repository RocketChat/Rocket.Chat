export type PluginOptions = {
	/**
	 * The prefix used to identify Meteor package imports.
	 * @default 'meteor/'.
	 */
	prefix?: string;
	/**
	 * Whether to treeshake the Meteor runtime and packages.
	 * @default process.env.NODE_ENV === 'production'.
	 */
	treeshake?: boolean;
	/**
	 * Whether the build is targeting the client.
	 * @default true.
	 */
	isClient?: boolean;
	/**
	 * The module id used to import the Meteor runtime shim.
	 * @default 'virtual:meteor-runtime'.
	 */
	runtimeImportId?: string;
	/**
	 * The root URL of the Meteor application.
	 * @default process.env.ROOT_URL || 'http://localhost:3000/'.
	 */
	rootUrl?: string;
	/**
	 * The path to the Meteor project root directory.
	 * @default process.cwd().
	 */
	projectRoot?: string;
	/**
	 * The path to the Meteor programs directory relative to the project root.
	 * @default '.meteor/local/build/programs/'
	 */
	programsDir?: string;
	/**
	 * Port where the Meteor server runtime should listen for HTTP/SockJS traffic.
	 * @default process.env.VITE_METEOR_SERVER_PORT || process.env.METEOR_SERVER_PORT || 33335
	 */
	meteorServerPort?: number;
	/**
	 * Use the native WebSocket implementation instead of SockJS on the client side.
	 * @default true
	 */
	disableSockJS?: boolean;
	/**
	 * Whether to configure the Meteor runtime for modern browsers.
	 * @default true
	 */
	isModern?: boolean;
};

export type ResolvedPluginOptions = {
	/**
	 * The prefix used to identify Meteor package imports.
	 */
	readonly prefix: string;
	/**
	 * Whether to treeshake the Meteor runtime and packages.
	 */
	readonly treeshake: boolean;
	/**
	 * Whether the build is targeting the client.
	 */
	readonly isClient: boolean;
	/**
	 * The module id used to import the Meteor runtime shim.
	 */
	readonly runtimeImportId: string;
	/**
	 * The root URL of the Meteor application.
	 */
	readonly rootUrl: URL;
	/**
	 * The absolute path to the Meteor project root directory.
	 */
	readonly projectRoot: string;
	/**
	 * The absolute path to the Meteor programs directory.
	 */
	readonly programsDir: string;
	/**
	 * Port where the Meteor runtime's HTTP server listens.
	 */
	readonly meteorServerPort: number;
	/**
	 * Whether to disable SockJS and use native WebSocket on the client side.
	 */
	readonly disableSockJS: boolean;
	/**
	 * Whether to configure the Meteor runtime for modern browsers.
	 */
	readonly isModern: boolean;
};

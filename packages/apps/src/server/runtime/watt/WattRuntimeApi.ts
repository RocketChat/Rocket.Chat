import type { EventEmitter } from 'node:events';

/**
 * Minimal, hand-written type surface for the subset of Platformatic Watt's
 * programmatic runtime API (`@platformatic/runtime`) that the Apps-Engine relies
 * on.
 *
 * We deliberately do not depend on the package's own type declarations: Watt is
 * an *optional* runtime dependency (the Node subprocess runtime remains the
 * default), so it may not be installed at build time. Declaring only what we use
 * keeps the contract explicit and the package type-checkable without it.
 *
 * @see https://github.com/platformatic/platformatic - packages/runtime
 */

export type WattApplicationDefinition = {
	id: string;
	// Absolute path to the application root Watt should load
	path: string;
	// Inline configuration for the application (a `watt.json`-equivalent object)
	config?: Record<string, unknown>;
};

export type WattRuntimeConfig = {
	// Absolute path used as the runtime working directory
	basePath?: string;
	// Whether the runtime should watch files for changes (always false for us)
	watch?: boolean;
	// Each entry becomes a Node.js Worker Thread managed by the single runtime
	applications: WattApplicationDefinition[];
	// Restart/health behaviour handled by Watt itself instead of a LivenessManager
	restartOnError?: boolean | number;
	health?: {
		enabled?: boolean;
		interval?: number;
		gracePeriod?: number;
		maxUnhealthyChecks?: number;
		maxELU?: number;
		maxHeapUsed?: number;
		maxHeapTotal?: number;
	};
	metrics?: {
		enabled?: boolean;
	};
	logger?: {
		level?: string;
	};
};

/**
 * The object returned by `create()` - a single runtime instance able to host
 * many applications, each in its own Worker Thread.
 */
export interface WattRuntime extends EventEmitter {
	start(silent?: boolean): Promise<string>;
	close(silent?: boolean): Promise<void>;

	addApplications(applications: WattApplicationDefinition[], start?: boolean): Promise<void>;
	removeApplications(applications: string[], silent?: boolean): Promise<void>;

	startApplication(id: string, silent?: boolean): Promise<void>;
	stopApplication(id: string, silent?: boolean): Promise<void>;
	restartApplication(id: string): Promise<void>;

	getApplicationsIds(): string[];

	/**
	 * Sends an ITC command to an application's Worker Thread and resolves with the
	 * worker's response. Used as the host -> app leg of the JSON-RPC channel.
	 */
	sendCommandToApplication(id: string, name: string, message?: unknown): Promise<unknown>;

	/**
	 * Thread-specific metrics gathered by Watt for every worker.
	 */
	getMetrics(format?: 'json'): Promise<{ metrics: unknown[] }>;
	getMetrics(format: 'text'): Promise<string>;

	getApplicationResourcesInfo(id: string): Promise<{ workers: number; health: Record<string, unknown> }>;
}

/**
 * The module shape of `@platformatic/runtime` that we consume.
 */
export type WattRuntimeModule = {
	create(root: string, config?: string | WattRuntimeConfig, context?: Record<string, unknown>): Promise<WattRuntime>;
};

/**
 * The single ITC command name every message (in both directions) travels under.
 * The payload is always a JSON-RPC envelope or one of the ping/pong sentinels.
 */
export const WATT_MESSAGE_COMMAND = 'apps-engine:message';

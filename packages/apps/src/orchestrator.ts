import type { AppEvents } from './AppsEngine';
import type { IAppServerOrchestrator } from './IAppServerOrchestrator';
import type { IAppsEngine } from './IAppsEngine';

let orchestrator: IAppServerOrchestrator | undefined;
let appsEngine: IAppsEngine | undefined;

/**
 * Registers the in-process orchestrator implementation. The orchestrator is the
 * Meteor-bound object that actually drives the Apps-Engine; it is consumed by the
 * facade backing ({@link IAppsEngine}), not by external callers.
 */
export function registerOrchestrator(orch: IAppServerOrchestrator): void {
	orchestrator = orch;
}

/**
 * Direct reference to the registered orchestrator, for the facade backing
 * (`AppsEngineService`). This is intentionally **not** part of the public `Apps`
 * facade — external callers must go through `Apps`.
 */
export function getOrchestrator(): IAppServerOrchestrator | undefined {
	return orchestrator;
}

/**
 * Injects the {@link IAppsEngine} implementation that backs the `Apps` facade.
 */
export function registerAppsEngine(impl: IAppsEngine): void {
	appsEngine = impl;
}

function requireAppsEngine(): IAppsEngine {
	if (!appsEngine) {
		// Provider managers expect this exact error when the engine is unavailable.
		throw new Error('apps-engine-not-loaded');
	}

	return appsEngine;
}

/**
 * The single, injectable, serializable entry point into the Apps-Engine. It
 * delegates to the registered {@link IAppsEngine} implementation and folds in the
 * not-loaded guard so callers keep their `result ?? original` / fire-and-forget
 * semantics: queries resolve to `undefined`/empty and `triggerEvent` resolves to
 * `undefined` while the engine is not yet available.
 */
export const Apps: IAppsEngine = {
	isLoaded(): boolean {
		return appsEngine?.isLoaded() ?? false;
	},

	isInitialized(): boolean {
		return appsEngine?.isInitialized() ?? false;
	},

	async triggerEvent(event: AppEvents, ...payload: unknown[]): Promise<any> {
		return appsEngine?.triggerEvent(event, ...payload);
	},

	async getApps(query) {
		return appsEngine?.getApps(query);
	},

	async getAppStorageItemById(appId) {
		return appsEngine?.getAppStorageItemById(appId);
	},

	async getAppsStatusLocal() {
		return (await appsEngine?.getAppsStatusLocal()) ?? [];
	},

	async getAppsStatusInNodes() {
		return (await appsEngine?.getAppsStatusInNodes()) ?? {};
	},

	videoConfProviders: {
		async isFullyConfigured(providerName) {
			return requireAppsEngine().videoConfProviders.isFullyConfigured(providerName);
		},
		async getVideoConferenceInfo(providerName, call, user) {
			return requireAppsEngine().videoConfProviders.getVideoConferenceInfo(providerName, call, user);
		},
		async generateUrl(providerName, call) {
			return requireAppsEngine().videoConfProviders.generateUrl(providerName, call);
		},
		async customizeUrl(providerName, call, user, options) {
			return requireAppsEngine().videoConfProviders.customizeUrl(providerName, call, user, options);
		},
		async onNewVideoConference(providerName, call) {
			return requireAppsEngine().videoConfProviders.onNewVideoConference(providerName, call);
		},
		async onVideoConferenceChanged(providerName, call) {
			return requireAppsEngine().videoConfProviders.onVideoConferenceChanged(providerName, call);
		},
		async onUserJoin(providerName, call, user) {
			return requireAppsEngine().videoConfProviders.onUserJoin(providerName, call, user);
		},
	},

	outboundProviders: {
		async getProviderMetadata(appId, type) {
			return requireAppsEngine().outboundProviders.getProviderMetadata(appId, type);
		},
		async sendOutboundMessage(appId, type, message) {
			return requireAppsEngine().outboundProviders.sendOutboundMessage(appId, type, message);
		},
	},
};

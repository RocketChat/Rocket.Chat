import { ServiceClass } from '@rocket.chat/core-services';
import type { IFederationHomeserverService, IFederationHomeserverBridge, IHomeserverConfig, HomeserverEvent } from '@rocket.chat/core-services';
import { License } from '@rocket.chat/core-services';
import { settings } from '../../../app/settings/server';

export class FederationHomeserverService extends ServiceClass implements IFederationHomeserverService {
	protected name = 'federation-homeserver';
	
	private bridge?: IFederationHomeserverBridge;
	private enabled = false;
	private config: IHomeserverConfig = {
		enabled: false,
		url: '',
		domain: '',
		bridgePort: 8081,
		appServiceToken: '',
		homeserverToken: '',
	};

	async created() {
		// Initialize service
		console.log('[FederationHomeserver] Service created');
		await this.loadConfig();
		
		// Watch for setting changes
		settings.watchMultiple<boolean>([
			'Federation_Homeserver_enabled',
			'Federation_Homeserver_url',
			'Federation_Homeserver_domain',
			'Federation_Homeserver_bridge_port',
			'Federation_Homeserver_app_service_token',
			'Federation_Homeserver_homeserver_token',
		], async () => {
			await this.onSettingsChanged();
		});
	}

	async started() {
		console.log('[FederationHomeserver] Service started');
		if (this.config.enabled) {
			await this.onEnable();
		}
	}

	async stopped() {
		console.log('[FederationHomeserver] Service stopped');
		await this.onDisable();
	}

	public createBridge(): IFederationHomeserverBridge {
		// Will be implemented in Phase 2
		// For now, return a dummy implementation
		const { HomeserverBridge } = require('./infrastructure/HomeserverBridge');
		return new HomeserverBridge(this.config);
	}

	public async onEnable(): Promise<void> {
		if (this.enabled) {
			console.log('[FederationHomeserver] Already enabled');
			return;
		}

		try {
			console.log('[FederationHomeserver] Enabling federation');
			
			// Check if we have the necessary license
			const hasLicense = await License.hasModule('federation-homeserver');
			if (!hasLicense) {
				console.warn('[FederationHomeserver] No license for homeserver federation');
				// For development, we'll continue anyway
			}

			this.bridge = this.createBridge();
			await this.bridge.start();
			
			this.enabled = true;
			console.log('[FederationHomeserver] Federation enabled successfully');
			
			// Register event handlers
			this.registerEventHandlers();
		} catch (error) {
			console.error('[FederationHomeserver] Failed to enable federation:', error);
			this.enabled = false;
			throw error;
		}
	}

	public async onDisable(): Promise<void> {
		if (!this.enabled || !this.bridge) {
			console.log('[FederationHomeserver] Already disabled');
			return;
		}

		try {
			console.log('[FederationHomeserver] Disabling federation');
			await this.bridge.stop();
			this.bridge = undefined;
			this.enabled = false;
			console.log('[FederationHomeserver] Federation disabled successfully');
		} catch (error) {
			console.error('[FederationHomeserver] Failed to disable federation:', error);
			throw error;
		}
	}

	public isEnabled(): boolean {
		return this.enabled;
	}

	public getConfig(): IHomeserverConfig {
		return { ...this.config };
	}

	private async loadConfig(): Promise<void> {
		// Load configuration from settings
		this.config = {
			enabled: settings.get('Federation_Homeserver_enabled') ?? false,
			url: settings.get('Federation_Homeserver_url') ?? '',
			domain: settings.get('Federation_Homeserver_domain') ?? '',
			bridgePort: settings.get('Federation_Homeserver_bridge_port') ?? 8081,
			appServiceToken: settings.get('Federation_Homeserver_app_service_token') ?? '',
			homeserverToken: settings.get('Federation_Homeserver_homeserver_token') ?? '',
		};
		
		console.log('[FederationHomeserver] Config loaded:', {
			...this.config,
			appServiceToken: '***',
			homeserverToken: '***',
		});
	}

	private async onSettingsChanged(): Promise<void> {
		console.log('[FederationHomeserver] Settings changed, reloading config');
		const wasEnabled = this.config.enabled;
		await this.loadConfig();
		
		// Handle enable/disable based on settings change
		if (wasEnabled && !this.config.enabled) {
			await this.onDisable();
		} else if (!wasEnabled && this.config.enabled) {
			await this.onEnable();
		} else if (this.config.enabled && this.bridge) {
			// Restart bridge with new config
			console.log('[FederationHomeserver] Restarting bridge with new config');
			await this.bridge.stop();
			await this.bridge.start();
		}
	}

	private registerEventHandlers(): void {
		if (!this.bridge) {
			return;
		}

		// Register callback for incoming events
		this.bridge.onEvent(async (event: HomeserverEvent) => {
			console.log('[FederationHomeserver] Received event:', event.type, event.id);
			// Event handling will be implemented in later phases
		});
	}
}
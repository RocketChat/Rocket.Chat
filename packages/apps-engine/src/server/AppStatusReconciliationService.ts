import { AppStatus, AppStatusUtils } from '../definition/AppStatus';
import { AppDesiredStatus, AppDesiredStatusUtils } from '../definition/AppDesiredStatus';
import type { AppManager } from './AppManager';
import type { ProxiedApp } from './ProxiedApp';
import { AppStatusMigration } from './storage/AppStatusMigration';

export interface IReconciliationResult {
	appId: string;
	appName: string;
	desiredStatus: AppDesiredStatus;
	actualStatus: AppStatus;
	reconciled: boolean;
	error?: string;
}

export interface IReconciliationOptions {
	/** Interval in milliseconds between reconciliation attempts */
	intervalMs?: number;
	/** Maximum number of retry attempts for failed reconciliations */
	maxRetries?: number;
	/** Whether to log reconciliation activities */
	enableLogging?: boolean;
	/** Whether to run reconciliation automatically */
	autoReconcile?: boolean;
}

export class AppStatusReconciliationService {
	private reconciliationTimer?: NodeJS.Timeout;
	private readonly reconciliationAttempts = new Map<string, number>();
	private readonly options: Required<IReconciliationOptions>;

	constructor(
		private readonly appManager: AppManager,
		options: IReconciliationOptions = {}
	) {
		this.options = {
			intervalMs: options.intervalMs ?? 5 * 60 * 1000, // 5 minutes default
			maxRetries: options.maxRetries ?? 3,
			enableLogging: options.enableLogging ?? true,
			autoReconcile: options.autoReconcile ?? true,
		};
	}

	/**
	 * Starts the automatic reconciliation service
	 */
	public start(): void {
		if (this.reconciliationTimer) {
			this.log('Reconciliation service is already running');
			return;
		}

		if (!this.options.autoReconcile) {
			this.log('Auto-reconciliation is disabled');
			return;
		}

		this.log(`Starting reconciliation service with ${this.options.intervalMs}ms interval`);
		
		this.reconciliationTimer = setInterval(async () => {
			try {
				await this.reconcileAll();
			} catch (error) {
				this.log('Error during automatic reconciliation:', error);
			}
		}, this.options.intervalMs);
	}

	/**
	 * Stops the automatic reconciliation service
	 */
	public stop(): void {
		if (this.reconciliationTimer) {
			clearInterval(this.reconciliationTimer);
			this.reconciliationTimer = undefined;
			this.log('Reconciliation service stopped');
		}
	}

	/**
	 * Manually triggers reconciliation for all apps
	 */
	public async reconcileAll(): Promise<IReconciliationResult[]> {
		const apps = this.appManager.get();
		const results: IReconciliationResult[] = [];

		this.log(`Starting reconciliation for ${apps.length} apps`);

		for (const app of apps) {
			try {
				const result = await this.reconcileApp(app);
				results.push(result);
			} catch (error) {
				results.push({
					appId: app.getID(),
					appName: app.getName(),
					desiredStatus: app.getDesiredStatus(),
					actualStatus: await app.getStatus(),
					reconciled: false,
					error: error instanceof Error ? error.message : String(error),
				});
			}
		}

		const reconciledCount = results.filter(r => r.reconciled).length;
		const errorCount = results.filter(r => r.error).length;
		
		this.log(`Reconciliation completed: ${reconciledCount} reconciled, ${errorCount} errors`);

		return results;
	}

	/**
	 * Reconciles a specific app's status
	 */
	public async reconcileApp(app: ProxiedApp): Promise<IReconciliationResult> {
		const appId = app.getID();
		const appName = app.getName();
		const desiredStatus = app.getDesiredStatus();
		const actualStatus = await app.getStatus();

		const result: IReconciliationResult = {
			appId,
			appName,
			desiredStatus,
			actualStatus,
			reconciled: false,
		};

		// Check if reconciliation is needed
		if (await app.isInDesiredState()) {
			result.reconciled = true;
			this.reconciliationAttempts.delete(appId);
			return result;
		}

		// Check retry attempts
		const attempts = this.reconciliationAttempts.get(appId) ?? 0;
		if (attempts >= this.options.maxRetries) {
			result.error = `Maximum retry attempts (${this.options.maxRetries}) exceeded`;
			return result;
		}

		this.log(`Reconciling app "${appName}" (${appId}): ${desiredStatus} (desired) vs ${actualStatus} (actual)`);

		try {
			// Attempt reconciliation
			await this.performReconciliation(app, desiredStatus, actualStatus);
			
			// Verify reconciliation was successful
			const newActualStatus = await app.getStatus();
			result.actualStatus = newActualStatus;
			result.reconciled = await app.isInDesiredState();

			if (result.reconciled) {
				this.reconciliationAttempts.delete(appId);
				this.log(`Successfully reconciled app "${appName}" to ${desiredStatus}`);
			} else {
				this.reconciliationAttempts.set(appId, attempts + 1);
				result.error = `Reconciliation attempted but status mismatch persists: ${newActualStatus}`;
			}
		} catch (error) {
			this.reconciliationAttempts.set(appId, attempts + 1);
			result.error = error instanceof Error ? error.message : String(error);
			this.log(`Failed to reconcile app "${appName}":`, error);
		}

		return result;
	}

	/**
	 * Performs the actual reconciliation action
	 */
	private async performReconciliation(
		app: ProxiedApp,
		desiredStatus: AppDesiredStatus,
		currentStatus: AppStatus
	): Promise<void> {
		const appId = app.getID();

		switch (desiredStatus) {
			case AppDesiredStatus.ENABLED:
				if (!AppStatusUtils.isEnabled(currentStatus)) {
					// Don't attempt to enable apps with compiler errors
					if (currentStatus === AppStatus.COMPILER_ERROR_DISABLED) {
						throw new Error('Cannot enable app with compiler errors');
					}
					await this.appManager.enable(appId);
				}
				break;

			case AppDesiredStatus.DISABLED:
				if (AppStatusUtils.isEnabled(currentStatus)) {
					await this.appManager.disable(appId, AppStatus.MANUALLY_DISABLED);
				}
				break;

			case AppDesiredStatus.UNINSTALLED:
				await this.appManager.remove(appId);
				break;

			default:
				throw new Error(`Unknown desired status: ${desiredStatus}`);
		}
	}

	/**
	 * Gets reconciliation statistics
	 */
	public getReconciliationStats(): {
		totalApps: number;
		appsInDesiredState: number;
		appsNeedingReconciliation: number;
		appsWithPendingRetries: number;
	} {
		const apps = this.appManager.get();
		let appsInDesiredState = 0;
		let appsNeedingReconciliation = 0;

		// Note: This is synchronous and uses cached status, so it might not be 100% accurate
		// but gives a good overview for monitoring purposes
		apps.forEach(async (app) => {
			if (await app.isInDesiredState()) {
				appsInDesiredState++;
			} else {
				appsNeedingReconciliation++;
			}
		});

		return {
			totalApps: apps.length,
			appsInDesiredState,
			appsNeedingReconciliation,
			appsWithPendingRetries: this.reconciliationAttempts.size,
		};
	}

	/**
	 * Clears retry attempts for all apps or a specific app
	 */
	public clearRetryAttempts(appId?: string): void {
		if (appId) {
			this.reconciliationAttempts.delete(appId);
		} else {
			this.reconciliationAttempts.clear();
		}
	}

	/**
	 * Gets the list of apps that have failed reconciliation attempts
	 */
	public getFailedReconciliations(): Array<{ appId: string; attempts: number }> {
		return Array.from(this.reconciliationAttempts.entries()).map(([appId, attempts]) => ({
			appId,
			attempts,
		}));
	}

	/**
	 * Migrates all apps to use the dual-status system
	 */
	public async migrateAllAppsToD ualStatus(): Promise<void> {
		const storage = this.appManager.getStorage();
		const allApps = await storage.retrieveAll();
		let migratedCount = 0;

		this.log(`Starting migration of ${allApps.size} apps to dual-status system`);

		for (const [appId, item] of allApps) {
			if (AppStatusMigration.needsMigration(item)) {
				try {
					AppStatusMigration.migrateLegacyStatus(item);
					await storage.update(item);
					migratedCount++;
					this.log(`Migrated app "${item.info.name}" (${appId})`);
				} catch (error) {
					this.log(`Failed to migrate app "${item.info.name}" (${appId}):`, error);
				}
			}
		}

		this.log(`Migration completed: ${migratedCount} apps migrated`);
	}

	/**
	 * Logs messages if logging is enabled
	 */
	private log(message: string, ...args: any[]): void {
		if (this.options.enableLogging) {
			console.log(`[AppStatusReconciliation] ${message}`, ...args);
		}
	}
}
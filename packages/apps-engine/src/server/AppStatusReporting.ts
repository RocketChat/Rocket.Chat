import type { AppStatus } from '../definition/AppStatus';
import type { AppDesiredStatus } from '../definition/AppDesiredStatus';
import type { ProxiedApp } from './ProxiedApp';

/**
 * Enhanced app status report that includes both desired and actual status
 */
export interface IAppStatusReport {
	appId: string;
	appName: string;
	appVersion: string;
	instanceId: string;
	desiredStatus: AppDesiredStatus;
	initStatus: AppStatus;
	/** @deprecated Use desiredStatus and initStatus instead */
	status: AppStatus;
	isInDesiredState: boolean;
	lastUpdated: Date;
	installationSource: string;
	reconciliationAttempts?: number;
}

/**
 * Cluster-wide app status report
 */
export interface IClusterAppStatusReport {
	[appId: string]: IAppStatusReport[];
}

/**
 * Summary statistics for app status across cluster
 */
export interface IAppStatusSummary {
	totalApps: number;
	appsInDesiredState: number;
	appsNeedingReconciliation: number;
	enabledApps: number;
	disabledApps: number;
	errorApps: number;
	byDesiredStatus: {
		[key in AppDesiredStatus]: number;
	};
	byInitStatus: {
		[key in AppStatus]: number;
	};
}

/**
 * Service for generating app status reports
 */
export class AppStatusReporting {
	/**
	 * Generates a status report for a single app
	 */
	public static async generateAppReport(
		app: ProxiedApp, 
		instanceId: string
	): Promise<IAppStatusReport> {
		const initStatus = await app.getStatus();
		const desiredStatus = app.getDesiredStatus();
		
		return {
			appId: app.getID(),
			appName: app.getName(),
			appVersion: app.getVersion(),
			instanceId,
			desiredStatus,
			initStatus,
			status: initStatus, // Legacy field
			isInDesiredState: await app.isInDesiredState(),
			lastUpdated: new Date(),
			installationSource: app.getInstallationSource(),
		};
	}

	/**
	 * Generates status reports for multiple apps
	 */
	public static async generateMultipleAppReports(
		apps: ProxiedApp[],
		instanceId: string
	): Promise<IAppStatusReport[]> {
		const reports: IAppStatusReport[] = [];
		
		for (const app of apps) {
			try {
				const report = await this.generateAppReport(app, instanceId);
				reports.push(report);
			} catch (error) {
				console.error(`Failed to generate report for app ${app.getID()}:`, error);
				// Create a minimal error report
				reports.push({
					appId: app.getID(),
					appName: app.getName(),
					appVersion: app.getVersion(),
					instanceId,
					desiredStatus: app.getDesiredStatus(),
					initStatus: AppStatus.UNKNOWN,
					status: AppStatus.UNKNOWN,
					isInDesiredState: false,
					lastUpdated: new Date(),
					installationSource: app.getInstallationSource(),
				});
			}
		}
		
		return reports;
	}

	/**
	 * Generates a summary of app status statistics
	 */
	public static generateStatusSummary(reports: IAppStatusReport[]): IAppStatusSummary {
		const summary: IAppStatusSummary = {
			totalApps: reports.length,
			appsInDesiredState: 0,
			appsNeedingReconciliation: 0,
			enabledApps: 0,
			disabledApps: 0,
			errorApps: 0,
			byDesiredStatus: {
				[AppDesiredStatus.ENABLED]: 0,
				[AppDesiredStatus.DISABLED]: 0,
				[AppDesiredStatus.UNINSTALLED]: 0,
			},
			byInitStatus: {} as { [key in AppStatus]: number },
		};

		// Initialize all AppStatus counts to 0
		Object.values(AppStatus).forEach(status => {
			summary.byInitStatus[status] = 0;
		});

		for (const report of reports) {
			// Count desired status
			summary.byDesiredStatus[report.desiredStatus]++;
			
			// Count init status
			summary.byInitStatus[report.initStatus]++;
			
			// Count state alignment
			if (report.isInDesiredState) {
				summary.appsInDesiredState++;
			} else {
				summary.appsNeedingReconciliation++;
			}
			
			// Count by general categories
			if (report.initStatus === AppStatus.AUTO_ENABLED || report.initStatus === AppStatus.MANUALLY_ENABLED) {
				summary.enabledApps++;
			} else if (this.isDisabledStatus(report.initStatus)) {
				summary.disabledApps++;
			}
			
			if (this.isErrorStatus(report.initStatus)) {
				summary.errorApps++;
			}
		}

		return summary;
	}

	/**
	 * Formats a status report for human-readable display
	 */
	public static formatReportForDisplay(report: IAppStatusReport): string {
		const statusIndicator = report.isInDesiredState ? '✅' : '⚠️';
		const errorIndicator = this.isErrorStatus(report.initStatus) ? '❌' : '';
		
		return `${statusIndicator} ${errorIndicator} ${report.appName} (${report.appId})
  Desired: ${report.desiredStatus}
  Actual: ${report.initStatus}
  Instance: ${report.instanceId}
  In Desired State: ${report.isInDesiredState}
  Last Updated: ${report.lastUpdated.toISOString()}`;
	}

	/**
	 * Formats a cluster report for human-readable display
	 */
	public static formatClusterReportForDisplay(clusterReport: IClusterAppStatusReport): string {
		let output = 'Cluster App Status Report\n';
		output += '========================\n\n';
		
		for (const [appId, reports] of Object.entries(clusterReport)) {
			if (reports.length === 0) continue;
			
			const firstReport = reports[0];
			output += `App: ${firstReport.appName} (${appId})\n`;
			output += `Desired Status: ${firstReport.desiredStatus}\n`;
			output += `Instances (${reports.length}):\n`;
			
			for (const report of reports) {
				const statusIndicator = report.isInDesiredState ? '✅' : '⚠️';
				const errorIndicator = this.isErrorStatus(report.initStatus) ? '❌' : '';
				output += `  ${statusIndicator} ${errorIndicator} ${report.instanceId}: ${report.initStatus}\n`;
			}
			
			output += '\n';
		}
		
		return output;
	}

	/**
	 * Filters reports to show only apps that need reconciliation
	 */
	public static filterNeedingReconciliation(reports: IAppStatusReport[]): IAppStatusReport[] {
		return reports.filter(report => !report.isInDesiredState);
	}

	/**
	 * Filters reports to show only apps with errors
	 */
	public static filterWithErrors(reports: IAppStatusReport[]): IAppStatusReport[] {
		return reports.filter(report => this.isErrorStatus(report.initStatus));
	}

	/**
	 * Groups reports by desired status
	 */
	public static groupByDesiredStatus(reports: IAppStatusReport[]): Map<AppDesiredStatus, IAppStatusReport[]> {
		const groups = new Map<AppDesiredStatus, IAppStatusReport[]>();
		
		for (const report of reports) {
			if (!groups.has(report.desiredStatus)) {
				groups.set(report.desiredStatus, []);
			}
			groups.get(report.desiredStatus)!.push(report);
		}
		
		return groups;
	}

	/**
	 * Groups reports by init status
	 */
	public static groupByInitStatus(reports: IAppStatusReport[]): Map<AppStatus, IAppStatusReport[]> {
		const groups = new Map<AppStatus, IAppStatusReport[]>();
		
		for (const report of reports) {
			if (!groups.has(report.initStatus)) {
				groups.set(report.initStatus, []);
			}
			groups.get(report.initStatus)!.push(report);
		}
		
		return groups;
	}

	/**
	 * Checks if a status represents a disabled state
	 */
	private static isDisabledStatus(status: AppStatus): boolean {
		return [
			AppStatus.MANUALLY_DISABLED,
			AppStatus.DISABLED,
			AppStatus.COMPILER_ERROR_DISABLED,
			AppStatus.ERROR_DISABLED,
			AppStatus.INVALID_LICENSE_DISABLED,
			AppStatus.INVALID_INSTALLATION_DISABLED,
			AppStatus.INVALID_SETTINGS_DISABLED,
		].includes(status);
	}

	/**
	 * Checks if a status represents an error state
	 */
	private static isErrorStatus(status: AppStatus): boolean {
		return [
			AppStatus.COMPILER_ERROR_DISABLED,
			AppStatus.ERROR_DISABLED,
			AppStatus.INVALID_LICENSE_DISABLED,
			AppStatus.INVALID_INSTALLATION_DISABLED,
			AppStatus.INVALID_SETTINGS_DISABLED,
		].includes(status);
	}
}
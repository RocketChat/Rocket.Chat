export interface IDataMigrationRecord {
	_id: string;
	status: 'completed' | 'failed';
	lastRunAt: Date;
	lastRunHash: string;
	runCount: number;
	order: number;
	requiresManualReversion: boolean;
	manualReversionInstructions?: string;
	lastError?: string;
}

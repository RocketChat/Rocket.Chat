export interface IJob {
	name: string;

	nextRunAt?: Date | null;
	type?: 'once' | 'single' | 'normal';

	repeatInterval?: string | number;
	repeatTimezone?: string | null;
	repeatAt?: string;

	lastRunAt?: Date;
	lastFinishedAt?: Date;

	failedAt?: Date;
	lockedAt?: Date | null;

	disabled?: boolean;

	priority?: number;

	failReason?: string | Error;
	failCount?: number;

	lastModifiedBy?: string;

	data?: Record<string, any>;
}

export interface IJobAttributes extends Omit<IJob, 'lastModifiedBy'> {
	_id: string;

	unique?: Record<string, any>;
	uniqueOpts?: { insertOnly?: boolean };
}

export interface IJobRecord extends IJob {
	_id: string;
}

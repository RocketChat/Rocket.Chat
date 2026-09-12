import type { IRocketChatRecord } from './IRocketChatRecord';

export type CronJobStatus = 'running' | 'scheduled' | 'failed' | 'disabled' | 'completed';

export type OmnichannelJobSource = 'auto-close' | 'auto-transfer' | 'queue-inactivity';

export interface ICronJobItem extends IRocketChatRecord {
	name: string;
	type?: 'once' | 'single' | 'normal';
	nextRunAt?: Date | null;
	repeatInterval?: string | number;
	repeatTimezone?: string | null;
	lastRunAt?: Date;
	lastFinishedAt?: Date;
	failedAt?: Date;
	lockedAt?: Date | null;
	disabled?: boolean;
	failReason?: string;
	failCount?: number;
	lastModifiedBy?: string;
	data?: Record<string, unknown>;
	status?: CronJobStatus;
}

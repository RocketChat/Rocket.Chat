export type ScheduleType = 'cron' | 'text';

export interface ICronJobs {
	add(name: string, schedule: string, callback: (day: string, hour: string) => void, scheduleType?: ScheduleType): void;
	remove(name: string): void;
	nextScheduledAtDate(name: string): Date | number | undefined;
}

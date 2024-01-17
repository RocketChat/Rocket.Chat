declare module 'cron' {
	export declare class CronTime {
		constructor(source: string | Date | Moment, zone?: string, utcOffset?: string | number);

		_getNextDateFrom<T>(date: T, zone?: string): T;
	}
}

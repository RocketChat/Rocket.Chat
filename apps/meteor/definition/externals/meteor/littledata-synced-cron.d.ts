declare module 'meteor/littledata:synced-cron' {
	import type { ParseStatic, ScheduleData } from 'later';

	namespace SyncedCron {
		function add(params: { name: string; schedule: (parser: ParseStatic) => ScheduleData; job: () => Promise<void> | void }): string;
		function remove(name: string): string;
		function nextScheduledAtDate(name: string): Date | number | undefined;
		function start(): void;
		function config(params: {
			logger(opts: { level: 'info' | 'warn' | 'debug' | 'error'; message: string }): void;
			collectionName: string;
		}): void;
	}
}

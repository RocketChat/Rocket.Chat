declare module 'meteor/littledata:synced-cron' {
	namespace SyncedCron {
		function add(params: { name: string; schedule: Function; job: Function }): string;
		function remove(name: string): string;
		function nextScheduledAtDate(name: string): Date | number | undefined;
	}
}

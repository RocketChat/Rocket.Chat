import { SyncedCron } from 'meteor/littledata:synced-cron';
import type { ICronJobs, ScheduleType } from '@rocket.chat/core-typings';
import type { ParseStatic } from 'later';

class SyncedCronJobs implements ICronJobs {
	add(name: string, schedule: string, callback: (day: string, hour: string) => void, scheduleType: ScheduleType = 'cron'): void {
		SyncedCron.add({
			name,
			schedule: (parser: ParseStatic) => parser[scheduleType](schedule),
			job() {
				const [day, hour] = this.name.split('/');
				callback(day, hour);
			},
		});
	}

	remove(name: string): void {
		SyncedCron.remove(name);
	}

	nextScheduledAtDate(name: string): Date | number | undefined {
		return SyncedCron.nextScheduledAtDate(name);
	}
}

export const cronJobs: ICronJobs = new SyncedCronJobs();

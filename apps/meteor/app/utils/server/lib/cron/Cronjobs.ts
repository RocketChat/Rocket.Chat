import { SyncedCron } from 'meteor/littledata:synced-cron';
import { ICronJobs, ScheduleType } from '@rocket.chat/core-typings';

class SyncedCronJobs implements ICronJobs {
	add(name: string, schedule: string, callback: Function, scheduleType: ScheduleType = 'cron'): void {
		SyncedCron.add({
			name,
			schedule: (parser: any) => parser[scheduleType](schedule),
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

import { SyncedCron } from 'meteor/littledata:synced-cron';

export interface ICronJobs {
	add(name: string, schedule: string, callback: Function): void;
	remove(name: string): void;
}

class SyncedCronJobs implements ICronJobs {
	add(name: string, schedule: string, callback: Function): void {
		SyncedCron.add({
			name,
			schedule: (parser: any) => parser.cron(schedule),
			job() {
				const [day, hour] = this.name.split('/');
				callback(day, hour);
			},
		});
	}

	remove(name: string): void {
		SyncedCron.remove(name);
	}
}

export const cronJobs: ICronJobs = new SyncedCronJobs();

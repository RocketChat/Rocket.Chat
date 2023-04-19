import type { Agenda } from '@rocket.chat/agenda';

export interface ICronJobs {
	add(
		name: string,
		schedule: string,
		callback: () => void | Promise<void>,
	): Promise<void>;
	remove(name: string): Promise<void>;
	has(name: string): Promise<boolean>;
	start(scheduler: Agenda): Promise<void>;

	started: boolean;
}

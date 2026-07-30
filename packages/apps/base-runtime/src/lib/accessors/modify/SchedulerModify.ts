import type { ISchedulerModify } from '@rocket.chat/apps-engine/definition/accessors';
import type { IOnetimeSchedule, IRecurringSchedule } from '@rocket.chat/apps-engine/definition/scheduler';

import { AppObjectRegistry } from '../../../AppObjectRegistry';
import type { RemoteBridges } from '../../bridges/RemoteBridges';

// Namespaces a job id with the app id, matching the host SchedulerModify. The app id here is used to
// build the id string (a non-identity, local use), so it reads the real id from the registry rather
// than the 'APP_ID' sentinel.
function createProcessorId(jobId: string, appId: string): string {
	return jobId.includes(`_${appId}`) ? jobId : `${jobId}_${appId}`;
}

export class SchedulerModify implements ISchedulerModify {
	constructor(private readonly bridges: RemoteBridges) {}

	private get appId(): string {
		return AppObjectRegistry.get<string>('id') || '';
	}

	public async scheduleOnce(job: IOnetimeSchedule): Promise<void | string> {
		return this.bridges.getSchedulerBridge().doScheduleOnce({ ...job, id: createProcessorId(job.id, this.appId) }, 'APP_ID') as Promise<
			void | string
		>;
	}

	public async scheduleRecurring(job: IRecurringSchedule): Promise<void | string> {
		return this.bridges
			.getSchedulerBridge()
			.doScheduleRecurring({ ...job, id: createProcessorId(job.id, this.appId) }, 'APP_ID') as Promise<void | string>;
	}

	public async cancelJob(jobId: string): Promise<void> {
		await this.bridges.getSchedulerBridge().doCancelJob(createProcessorId(jobId, this.appId), 'APP_ID');
	}

	public async cancelAllJobs(): Promise<void> {
		await this.bridges.getSchedulerBridge().doCancelAllJobs('APP_ID');
	}
}

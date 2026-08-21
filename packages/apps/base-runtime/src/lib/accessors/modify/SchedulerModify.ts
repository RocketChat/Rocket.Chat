import type { ISchedulerModify } from '@rocket.chat/apps-engine/definition/accessors';
import type { IOnetimeSchedule, IRecurringSchedule } from '@rocket.chat/apps-engine/definition/scheduler';

import { AppObjectRegistry } from '../../../AppObjectRegistry';
import { bridgeCall } from '../../bridges/bridgeCall';
import type * as Messenger from '../../messenger';

// Namespaces a job id with the app id, matching the host SchedulerModify. The app id here is used to
// build the id string (a non-identity, local use), so it reads the real id from the registry rather
// than the 'APP_ID' sentinel.
function createProcessorId(jobId: string, appId: string): string {
	return jobId.includes(`_${appId}`) ? jobId : `${jobId}_${appId}`;
}

export class SchedulerModify implements ISchedulerModify {
	constructor(private readonly senderFn: typeof Messenger.sendRequest) {}

	private get appId(): string {
		return AppObjectRegistry.get<string>('id') || '';
	}

	public async scheduleOnce(job: IOnetimeSchedule): Promise<void | string> {
		return bridgeCall<void | string>(
			this.senderFn,
			'getSchedulerBridge',
			'doScheduleOnce',
			{ ...job, id: createProcessorId(job.id, this.appId) },
			'APP_ID',
		);
	}

	public async scheduleRecurring(job: IRecurringSchedule): Promise<void | string> {
		return bridgeCall<void | string>(
			this.senderFn,
			'getSchedulerBridge',
			'doScheduleRecurring',
			{ ...job, id: createProcessorId(job.id, this.appId) },
			'APP_ID',
		);
	}

	public async cancelJob(jobId: string): Promise<void> {
		await bridgeCall(this.senderFn, 'getSchedulerBridge', 'doCancelJob', createProcessorId(jobId, this.appId), 'APP_ID');
	}

	public async cancelAllJobs(): Promise<void> {
		await bridgeCall(this.senderFn, 'getSchedulerBridge', 'doCancelAllJobs', 'APP_ID');
	}
}

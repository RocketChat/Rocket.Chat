import { AppStatus } from '../../definition/AppStatus';
import type { IJobContext, IOnetimeSchedule, IProcessor, IRecurringSchedule } from '../../definition/scheduler';
import type { AppManager } from '../AppManager';
import type { IInternalSchedulerBridge } from '../bridges/IInternalSchedulerBridge';
import type { SchedulerBridge } from '../bridges/SchedulerBridge';

function createProcessorId(jobId: string, appId: string): string {
    return jobId.includes(`_${appId}`) ? jobId : `${jobId}_${appId}`;
}

export class AppSchedulerManager {
    private readonly bridge: SchedulerBridge;

    private registeredProcessors: Map<string, { [processorId: string]: IProcessor }>;

    constructor(private readonly manager: AppManager) {
        this.bridge = this.manager.getBridges().getSchedulerBridge();
        this.registeredProcessors = new Map();
    }

    public async registerProcessors(processors: Array<IProcessor> = [], appId: string): Promise<void | Array<string>> {
        if (!this.registeredProcessors.get(appId)) {
            this.registeredProcessors.set(appId, {});
        }

        return this.bridge.doRegisterProcessors(
            processors.map((processor) => {
                const processorId = createProcessorId(processor.id, appId);

                this.registeredProcessors.get(appId)[processorId] = processor;

                return {
                    id: processorId,
                    processor: this.wrapProcessor(appId, processorId).bind(this),
                    startupSetting: processor.startupSetting,
                };
            }),
            appId,
        );
    }

    public wrapProcessor(appId: string, processorId: string): IProcessor['processor'] {
        return async (jobContext: IJobContext) => {
            const processor = this.registeredProcessors.get(appId)[processorId];

            if (!processor) {
                throw new Error(`Processor ${processorId} not available`);
            }

            const app = this.manager.getOneById(appId);
            const status = await app.getStatus();
            const previousStatus = app.getPreviousStatus();

            const isNotToRunJob = this.isNotToRunJob(status, previousStatus);

            if (isNotToRunJob) {
                return;
            }

            try {
                await app.getDenoRuntime().sendRequest({
                    method: `scheduler:${processor.id}`,
                    params: [jobContext],
                });
            } catch (e) {
                console.error(e);
                throw e;
            }
        };
    }

    public async scheduleOnce(job: IOnetimeSchedule, appId: string): Promise<void | string> {
        return this.bridge.doScheduleOnce({ ...job, id: createProcessorId(job.id, appId) }, appId);
    }

    public async scheduleRecurring(job: IRecurringSchedule, appId: string): Promise<void | string> {
        return this.bridge.doScheduleRecurring({ ...job, id: createProcessorId(job.id, appId) }, appId);
    }

    public async cancelJob(jobId: string, appId: string): Promise<void> {
        return this.bridge.doCancelJob(createProcessorId(jobId, appId), appId);
    }

    public async cancelAllJobs(appId: string): Promise<void> {
        return this.bridge.doCancelAllJobs(appId);
    }

    public async cleanUp(appId: string): Promise<void> {
        (this.bridge as IInternalSchedulerBridge & SchedulerBridge).cancelAllJobs(appId);
    }

    private isNotToRunJob(status: AppStatus, previousStatus: AppStatus): boolean {
        const isAppCurrentDisabled = status === AppStatus.DISABLED || status === AppStatus.MANUALLY_DISABLED;
        const wasAppDisabled = previousStatus === AppStatus.DISABLED || previousStatus === AppStatus.MANUALLY_DISABLED;

        return (status === AppStatus.INITIALIZED && wasAppDisabled) || isAppCurrentDisabled;
    }
}

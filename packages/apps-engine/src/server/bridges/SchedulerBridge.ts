import { BaseBridge } from './BaseBridge';
import type { IOnetimeSchedule, IProcessor, IRecurringSchedule } from '../../definition/scheduler';
import { PermissionDeniedError } from '../errors/PermissionDeniedError';
import { AppPermissionManager } from '../managers/AppPermissionManager';
import { AppPermissions } from '../permissions/AppPermissions';

export abstract class SchedulerBridge extends BaseBridge {
    public async doRegisterProcessors(processors: Array<IProcessor> = [], appId: string): Promise<void | Array<string>> {
        if (this.hasDefaultPermission(appId)) {
            return this.registerProcessors(processors, appId);
        }
    }

    public async doScheduleOnce(job: IOnetimeSchedule, appId: string): Promise<void | string> {
        if (this.hasDefaultPermission(appId)) {
            return this.scheduleOnce(job, appId);
        }
    }

    public async doScheduleRecurring(job: IRecurringSchedule, appId: string): Promise<void | string> {
        if (this.hasDefaultPermission(appId)) {
            return this.scheduleRecurring(job, appId);
        }
    }

    public async doCancelJob(jobId: string, appId: string): Promise<void> {
        if (this.hasDefaultPermission(appId)) {
            return this.cancelJob(jobId, appId);
        }
    }

    public async doCancelAllJobs(appId: string): Promise<void> {
        if (this.hasDefaultPermission(appId)) {
            return this.cancelAllJobs(appId);
        }
    }

    protected abstract registerProcessors(processors: Array<IProcessor>, appId: string): Promise<void | Array<string>>;

    protected abstract scheduleOnce(job: IOnetimeSchedule, appId: string): Promise<void | string>;

    protected abstract scheduleRecurring(job: IRecurringSchedule, appId: string): Promise<void | string>;

    protected abstract cancelJob(jobId: string, appId: string): Promise<void>;

    protected abstract cancelAllJobs(appId: string): Promise<void>;

    private hasDefaultPermission(appId: string): boolean {
        if (AppPermissionManager.hasPermission(appId, AppPermissions.scheduler.default)) {
            return true;
        }

        AppPermissionManager.notifyAboutError(
            new PermissionDeniedError({
                appId,
                missingPermissions: [AppPermissions.scheduler.default],
            }),
        );

        return false;
    }
}

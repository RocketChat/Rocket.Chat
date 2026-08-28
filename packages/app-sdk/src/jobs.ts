/**
 * Scheduled jobs.
 *
 * Legacy splits this across three shapes: `IProcessor` (a named processor with
 * an optional `startupSetting`), and `ISchedulerModify.scheduleOnce` /
 * `scheduleRecurring` (imperative, referencing a processor by string id with an
 * untyped `data` bag).
 *
 * The SDK has one primitive, `defineJob`, that carries an optional input schema
 * and an optional **declarative** schedule. Imperative scheduling
 * (`ctx.scheduler.runAt` / `runEvery`) references the job *by value*, so its
 * `data` payload is type-checked against the job's own `inputSchema`.
 *
 * This mirrors Mastra, which offers both declarative schedules
 * (`createWorkflow({ schedule: { cron } })`) and an imperative
 * `mastra.schedules.create({ workflowId, cron, inputData })`.
 */

import type { AppContext, AppEnv, BaseEnv } from './context';
import type { InferArg, Schema } from './schema';

/** How a job fires without being scheduled imperatively. */
export type JobSchedule =
	| { readonly cron: string; readonly timezone?: string; readonly skipImmediate?: boolean }
	/** Human interval, e.g. '30 seconds', '1 hour', '2 days'. */
	| { readonly every: string; readonly skipImmediate?: boolean }
	/** Run once each time the app starts/enables (legacy `StartupType.ONETIME`). */
	| { readonly onStartup: true };

export interface JobContext<Env extends AppEnv, TData> extends AppContext<Env> {
	readonly job: { readonly id: string; readonly scheduleId?: string };
	/** Typed job payload (validated against `inputSchema`). */
	readonly data: TData;
}

type DataOf<D> = InferArg<D, undefined>;

export interface JobDef<Env extends AppEnv, D extends Schema | undefined> {
	id: string;
	/** Schema for the job's data payload. */
	inputSchema?: D;
	/** Declarative schedule. Omit for a job that is only scheduled imperatively. */
	schedule?: JobSchedule;
	run(ctx: JobContext<Env, DataOf<D>>): Promise<void>;
}

export const JOB = Symbol.for('rc.app-sdk.job');

export type Job<Env extends AppEnv = AppEnv, D extends Schema | undefined = Schema | undefined> = JobDef<Env, D> & {
	readonly [JOB]: true;
};

export function defineJob<D extends Schema | undefined = undefined, Env extends AppEnv = BaseEnv>(
	def: JobDef<Env, D>,
): Job<Env, D> {
	if (!def.id) {
		throw new Error('defineJob: "id" is required');
	}
	return { ...def, [JOB]: true };
}

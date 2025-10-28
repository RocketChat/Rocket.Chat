import { CronTime } from 'cron';
import date from 'date.js';
import debugInitializer from 'debug';
import humanInterval from 'human-interval';
import moment from 'moment-timezone';

import type { Agenda, RepeatOptions } from './Agenda';
import type { IJob, IJobAttributes } from './definition/IJob';
import { noCallback } from './lib/noCallback';
import { parsePriority } from './lib/parsePriority';

const debug = debugInitializer('agenda:job');

export type JobArgs = {
	agenda: Agenda;
} & IJob;

export class Job {
	public agenda: Agenda;

	public attrs: IJobAttributes;

	constructor({ agenda, priority, ...args }: JobArgs) {
		args = args || {};

		this.agenda = agenda;

		this.attrs = {
			_id: '',
			...args,
			priority: parsePriority(priority),
			nextRunAt: args.nextRunAt || new Date(),
			type: args.type || 'once',
		};
	}

	public toJSON(): Partial<IJob> {
		const { _id, unique, uniqueOpts, ...props } = this.attrs || {};

		return props;
	}

	public computeNextRunAt(): Job {
		const { repeatInterval: interval, repeatAt } = this.attrs;

		const previousNextRunAt = this.attrs.nextRunAt || new Date();
		this.attrs.nextRunAt = null;

		if (interval) {
			this._computeFromInterval(interval, previousNextRunAt);
		} else if (repeatAt) {
			this._computeFromRepeatAt(repeatAt);
		}

		return this;
	}

	public dateForTimezone(date: Date, timezone?: string | null): moment.Moment {
		const newDate = moment(date);
		if (timezone) {
			newDate.tz(timezone);
		}

		return newDate;
	}

	private _computeFromInterval(interval: string | number, previousNextRunAt: Date): void {
		const { repeatTimezone: timezone, name, _id } = this.attrs;

		debug('[%s:%s] computing next run via interval [%s]', name, _id, interval);
		const lastRun = this.dateForTimezone(this.attrs.lastRunAt || new Date(), timezone);
		try {
			const cronTime = new CronTime(interval);
			let nextDate = cronTime._getNextDateFrom(lastRun);
			if (nextDate.valueOf() === lastRun.valueOf() || nextDate.valueOf() <= previousNextRunAt.valueOf()) {
				// Handle cronTime giving back the same date for the next run time
				nextDate = cronTime._getNextDateFrom(this.dateForTimezone(new Date(lastRun.valueOf() + 1000), timezone));
			}

			this.attrs.nextRunAt = new Date(nextDate.valueOf());
			debug('[%s:%s] nextRunAt set to [%s]', this.attrs.name, this.attrs._id, this.attrs.nextRunAt.toISOString());
		} catch (error) {
			// Nope, humanInterval then!
			try {
				const numberInterval = (typeof interval === 'number' ? interval : humanInterval(interval)) || 0;

				if (!this.attrs.lastRunAt && numberInterval) {
					this.attrs.nextRunAt = new Date(lastRun.valueOf());
					debug('[%s:%s] nextRunAt set to [%s]', this.attrs.name, this.attrs._id, this.attrs.nextRunAt.toISOString());
				} else {
					this.attrs.nextRunAt = new Date(lastRun.valueOf() + numberInterval);
					debug('[%s:%s] nextRunAt set to [%s]', this.attrs.name, this.attrs._id, this.attrs.nextRunAt.toISOString());
				}
				// Either `xo` linter or Node.js 8 stumble on this line if it isn't just ignored
			} catch (error) {
				//
			}
		} finally {
			if (!this.attrs.nextRunAt || isNaN(this.attrs.nextRunAt.valueOf())) {
				this.attrs.nextRunAt = null;
				debug('[%s:%s] failed to calculate nextRunAt due to invalid repeat interval', this.attrs.name, this.attrs._id);
				this.fail('failed to calculate nextRunAt due to invalid repeat interval');
			}
		}
	}

	private _computeFromRepeatAt(repeatAt: string): void {
		const lastRun = this.attrs.lastRunAt || new Date();
		const nextDate = date(repeatAt).valueOf();

		// If you do not specify offset date for below test it will fail for ms
		const offset = Date.now();
		if (offset === date(repeatAt, offset).valueOf()) {
			this.attrs.nextRunAt = null;
			debug('[%s:%s] failed to calculate repeatAt due to invalid format', this.attrs.name, this.attrs._id);
			this.fail('failed to calculate repeatAt time due to invalid format');
		} else if (nextDate.valueOf() === lastRun.valueOf()) {
			this.attrs.nextRunAt = date('tomorrow at ', repeatAt);
			debug('[%s:%s] nextRunAt set to [%s]', this.attrs.name, this.attrs._id, this.attrs.nextRunAt.toISOString());
		} else {
			this.attrs.nextRunAt = date(repeatAt);
			debug('[%s:%s] nextRunAt set to [%s]', this.attrs.name, this.attrs._id, this.attrs.nextRunAt.toISOString());
		}
	}

	public repeatEvery(interval: string | number, options: RepeatOptions = {}): Job {
		this.attrs.repeatInterval = interval;
		this.attrs.repeatTimezone = options.timezone ? options.timezone : null;

		if (options.skipImmediate) {
			// Set the lastRunAt time to the nextRunAt so that the new nextRunAt will be computed in reference to the current value.
			this.attrs.lastRunAt = this.attrs.nextRunAt || new Date();
			this.computeNextRunAt();
			this.attrs.lastRunAt = undefined;
		} else {
			this.computeNextRunAt();
		}
		return this;
	}

	public repeatAt(time: string): Job {
		this.attrs.repeatAt = time;
		return this;
	}

	public disable(): Job {
		this.attrs.disabled = true;
		return this;
	}

	public enable(): Job {
		this.attrs.disabled = false;
		return this;
	}

	public unique(unique: IJobAttributes['unique'], opts?: IJobAttributes['uniqueOpts']): Job {
		this.attrs.unique = unique;
		this.attrs.uniqueOpts = opts;
		return this;
	}

	public schedule(time: string | Date): Job {
		const d = new Date(time);
		this.attrs.nextRunAt = Number.isNaN(d.getTime()) ? date(time as string) : d;
		return this;
	}

	public priority(priority: string): Job {
		this.attrs.priority = parsePriority(priority);
		return this;
	}

	public fail(reason: Error | string): Job {
		if (reason instanceof Error) {
			reason = reason.message;
		}

		this.attrs.failReason = reason;
		this.attrs.failCount = (this.attrs.failCount || 0) + 1;

		const now = new Date();
		this.attrs.failedAt = now;
		this.attrs.lastFinishedAt = now;
		debug('[%s:%s] fail() called [%d] times so far', this.attrs.name, this.attrs._id, this.attrs.failCount);
		return this;
	}

	public run(): Promise<Job> {
		const definition = this.agenda.getDefinition(this.attrs.name);

		return new Promise(async (resolve, reject) => {
			this.attrs.lastRunAt = new Date();
			debug('[%s:%s] setting lastRunAt to: %s', this.attrs.name, this.attrs._id, this.attrs.lastRunAt.toISOString());
			this.computeNextRunAt();
			await this.save();

			let finished = false;
			const jobCallback = async (err?: Error): Promise<void> => {
				// We don't want to complete the job multiple times
				if (finished) {
					return;
				}

				finished = true;

				if (err) {
					this.fail(err);
				} else {
					this.attrs.lastFinishedAt = new Date();
				}

				this.attrs.lockedAt = null;

				await this.save().catch((error) => {
					debug('[%s:%s] failed to be saved to MongoDB', this.attrs.name, this.attrs._id);
					reject(error);
				});
				debug('[%s:%s] was saved successfully to MongoDB', this.attrs.name, this.attrs._id);

				if (err) {
					this.agenda.emit('fail', err, this);
					this.agenda.emit(`fail:${this.attrs.name}`, err, this);
					debug('[%s:%s] has failed [%s]', this.attrs.name, this.attrs._id, err.message);
				} else {
					this.agenda.emit('success', this);
					this.agenda.emit(`success:${this.attrs.name}`, this);
					debug('[%s:%s] has succeeded', this.attrs.name, this.attrs._id);
				}

				this.agenda.emit('complete', this);
				this.agenda.emit(`complete:${this.attrs.name}`, this);
				debug('[%s:%s] job finished at [%s] and was unlocked', this.attrs.name, this.attrs._id, this.attrs.lastFinishedAt);
				// Curiously, we still resolve successfully if the job processor failed.
				// Agenda is not equipped to handle errors originating in user code, so, we leave them to inspect the side-effects of job.fail()
				resolve(this);
			};

			try {
				this.agenda.emit('start', this);
				this.agenda.emit(`start:${this.attrs.name}`, this);
				debug('[%s:%s] starting job', this.attrs.name, this.attrs._id);
				if (!definition) {
					debug('[%s:%s] has no definition, can not run', this.attrs.name, this.attrs._id);
					throw new Error('Undefined job');
				}

				if (definition.fn.length === 2) {
					debug('[%s:%s] process function being called', this.attrs.name, this.attrs._id);
					await definition.fn(this, jobCallback);
				} else {
					debug('[%s:%s] process function being called', this.attrs.name, this.attrs._id);
					await definition.fn(this);
					await jobCallback();
				}
			} catch (error: any) {
				debug('[%s:%s] unknown error occurred', this.attrs.name, this.attrs._id);
				await jobCallback(error);
			}
		});
	}

	public isRunning(): boolean {
		if (!this.attrs.lastRunAt) {
			return false;
		}

		if (!this.attrs.lastFinishedAt) {
			return true;
		}

		if (this.attrs.lockedAt && this.attrs.lastRunAt.getTime() > this.attrs.lastFinishedAt.getTime()) {
			return true;
		}

		return false;
	}

	public save(...args: Array<any>): Promise<void> {
		noCallback(args);

		return this.agenda.saveJob(this);
	}

	public remove(): Promise<number> {
		return this.agenda.cancel({ _id: this.attrs._id });
	}

	public async touch(...args: Array<any>): Promise<void> {
		noCallback(args);
		this.attrs.lockedAt = new Date();
		return this.save();
	}
}

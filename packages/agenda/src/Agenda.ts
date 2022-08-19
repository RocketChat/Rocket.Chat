import { EventEmitter } from 'events';

import humanInterval from 'human-interval';
import { MongoClient } from 'mongodb';
import type { MongoClientOptions, Db, Document, Collection, ModifyResult, InsertOneResult } from 'mongodb';
import debugInitializer from 'debug';

import { hasMongoProtocol } from './lib/hasMongoProtocol';
import { createJob } from './createJob';
import { noCallback } from './lib/noCallback';
import { Job } from './Job';
import { JobProcessingQueue } from './JobProcessingQueue';
import type { JobDefinition, JobOptions } from './definition/JobDefinition';
import type { IJob } from './definition/IJob';

const debug = debugInitializer('agenda:agenda');

const defaultInterval = 5000;

type JobSort = Partial<Record<keyof IJob, 1 | -1>>;

type AgendaConfig = {
	name?: string;
	processEvery?: string;
	defaultConcurrency?: number;
	maxConcurrency?: number;
	defaultLockLimit?: number;
	lockLimit?: number;
	defaultLockLifeTime?: number;

	sort?: JobSort;
} & (
	| {
			mongo: Db;
			db?: {
				collection?: string;
			};
	  }
	| {
			mongo?: undefined;
			db?: {
				address: string;
				collection?: string;
				options?: MongoClientOptions;
			};
	  }
);

type AgendaCallback = (error: unknown, result: unknown) => void;

export type RepeatOptions = { timezone?: string; skipImmediate?: boolean };

export class Agenda extends EventEmitter {
	private _name: string | undefined;

	private _processEvery: number;

	private _defaultConcurrency: number;

	private _maxConcurrency: number;

	private _defaultLockLimit: number;

	private _defaultLockLifetime: number;

	// @ts-ignore
	private _db: MongoClient;

	// @ts-ignore
	private _mdb: Db;

	// @ts-ignore
	private _collection: Collection;

	private _definitions: Record<string, JobDefinition> = {};

	private _runningJobs: Job[];

	private _lockedJobs: Job[];

	private _jobsToLock: Job[];

	private _jobQueue: JobProcessingQueue;

	private _lockLimit: number;

	private _sort: JobSort;

	private _indexes: JobSort;

	private _isLockingOnTheFly: boolean;

	private _ready: Promise<void>;

	private _processInterval: NodeJS.Timeout | undefined;

	private _nextScanAt?: Date;

	private _mongoUseUnifiedTopology: boolean | undefined;

	constructor(config: AgendaConfig = {}, cb?: AgendaCallback) {
		super();

		this._name = config.name;
		this._processEvery = humanInterval(config.processEvery) || defaultInterval;
		this._defaultConcurrency = config.defaultConcurrency || 5;
		this._maxConcurrency = config.maxConcurrency || 20;
		this._defaultLockLimit = config.defaultLockLimit || 0;
		this._lockLimit = config.lockLimit || 0;

		this._definitions = {};
		this._runningJobs = [];
		this._lockedJobs = [];
		this._jobQueue = new JobProcessingQueue();
		this._defaultLockLifetime = config.defaultLockLifeTime || 10 * 60 * 1000; // 10 minute default lockLifetime
		this._sort = config.sort || { nextRunAt: 1, priority: -1 };
		this._indexes = { name: 1, ...this._sort, priority: -1, lockedAt: 1, nextRunAt: 1, disabled: 1 };

		this._isLockingOnTheFly = false;
		this._jobsToLock = [];
		this._ready = new Promise((resolve) => this.once('ready', resolve));

		if (config.mongo) {
			this.mongo(config.mongo, config.db ? config.db.collection : undefined, cb);
			// @ts-ignore
			if (config.mongo.s && config.mongo.topology && config.mongo.topology.s) {
				// @ts-ignore
				this._mongoUseUnifiedTopology = Boolean(config.mongo?.topology?.s?.options?.useUnifiedTopology);
			}
		} else if (config.db) {
			this.database(config.db.address, config.db.collection, config.db.options, cb);
		}
	}

	public mongo(mdb: Db, collection: string | undefined, cb?: AgendaCallback): Agenda {
		this._mdb = mdb;
		this.dbInit(collection, cb);
		return this;
	}

	/**
	 * * NOTE:
	 * If `url` includes auth details then `options` must specify: { 'uri_decode_auth': true }. This does Auth on
	 * the specified database, not the Admin database. If you are using Auth on the Admin DB and not on the Agenda DB,
	 * then you need to authenticate against the Admin DB and then pass the MongoDB instance into the constructor
	 * or use Agenda.mongo(). If your app already has a MongoDB connection then use that. ie. specify config.mongo in
	 * the constructor or use Agenda.mongo().
	 */
	public database(url: string, collection: string | undefined, options: MongoClientOptions = {}, cb?: AgendaCallback): Agenda {
		if (!hasMongoProtocol(url)) {
			url = `mongodb://${url}`;
		}

		collection = collection || 'agendaJobs';

		options = {
			...options,
		};

		MongoClient.connect(url, options, (error, client) => {
			if (error || !client) {
				debug('error connecting to MongoDB using collection: [%s]', collection);
				if (cb) {
					cb(error, null);
				} else {
					throw error;
				}
				return;
			}

			debug('successful connection to MongoDB using collection: [%s]', collection);
			this._db = client;
			this._mdb = client.db();
			this.dbInit(collection, cb);
		});

		return this;
	}

	public dbInit(collection: string | undefined, cb?: AgendaCallback): void {
		debug('init database collection using name [%s]', collection);
		this._collection = this._mdb.collection(collection || 'agendaJobs');
		debug('attempting index creation');
		this._collection.createIndex(this._indexes, { name: 'findAndLockNextJobIndex' }, (err) => {
			if (err) {
				debug('index creation failed');
				this.emit('error', err);
			} else {
				debug('index creation success');
				this.emit('ready');
			}

			if (cb) {
				cb(err, this._collection);
			}
		});
	}

	public name(name: string): Agenda {
		debug('Agenda.name(%s)', name);
		this._name = name;
		return this;
	}

	public processEvery(time: string): Agenda {
		debug('Agenda.processEvery(%d)', time);
		this._processEvery = humanInterval(time) || defaultInterval;
		return this;
	}

	public maxConcurrency(num: number): Agenda {
		debug('Agenda.maxConcurrency(%d)', num);
		this._maxConcurrency = num;
		return this;
	}

	public defaultConcurrency(num: number): Agenda {
		debug('Agenda.defaultConcurrency(%d)', num);
		this._defaultConcurrency = num;
		return this;
	}

	public lockLimit(num: number): Agenda {
		debug('Agenda.lockLimit(%d)', num);
		this._lockLimit = num;
		return this;
	}

	public defaultLockLimit(num: number): Agenda {
		debug('Agenda.defaultLockLimit(%d)', num);
		this._defaultLockLimit = num;
		return this;
	}

	public defaultLockLifetime(ms: number): Agenda {
		debug('Agenda.defaultLockLifetime(%d)', ms);
		this._defaultLockLifetime = ms;
		return this;
	}

	public sort(query: JobSort): Agenda {
		debug('Agenda.sort([Object])');
		this._sort = query;
		return this;
	}

	public create(name: string, data: IJob['data'] = {}): Job {
		debug('Agenda.create(%s, [Object])', name);
		const priority = this._definitions[name] ? this._definitions[name].priority : 0;
		const job = new Job({
			name,
			data,
			type: 'normal',
			priority,
			agenda: this,
		});
		return job;
	}

	public async jobs(query = {}, sort = {}, limit = 0, skip = 0): Promise<Job[]> {
		const result = await this._collection.find<IJob>(query).sort(sort).limit(limit).skip(skip).toArray();

		return result.map((job) => createJob(this, job));
	}

	public async purge(): Promise<unknown> {
		// @NOTE: Only use after defining your jobs
		const definedNames = Object.keys(this._definitions);
		debug('Agenda.purge(%o)', definedNames);
		return this.cancel({ name: { $not: { $in: definedNames } } });
	}

	public define(name: string, processor: JobDefinition['fn']): void;

	public define(name: string, maybeOptions: Partial<JobOptions> | JobDefinition['fn'], maybeProcessor?: JobDefinition['fn']): void {
		const processor: JobDefinition['fn'] = maybeProcessor || (maybeOptions as JobDefinition['fn']);
		const options: Partial<JobOptions> = maybeProcessor ? (maybeOptions as Partial<JobOptions>) : {};

		this._definitions[name] = {
			fn: processor,
			concurrency: options.concurrency || this._defaultConcurrency,
			lockLimit: options.lockLimit || this._defaultLockLimit,
			priority: options.priority || 0,
			lockLifetime: options.lockLifetime || this._defaultLockLifetime,
			running: 0,
			locked: 0,
		};
		debug('job [%s] defined with following options: \n%O', name, this._definitions[name]);
	}

	public async every(interval: string | number, name: string, data: IJob['data'], options: RepeatOptions): Promise<Job>;

	public async every(interval: string | number, names: string[], data: IJob['data'], options: RepeatOptions): Promise<Job[]>;

	public async every(
		interval: string | number,
		names: string | string[],
		data: IJob['data'],
		options: RepeatOptions,
	): Promise<Job | Job[] | undefined> {
		if (typeof names === 'string') {
			debug('Agenda.every(%s, %O, %O)', interval, names, options);
			return this._createIntervalJob(interval, names, data, options);
		}

		if (Array.isArray(names)) {
			debug('Agenda.every(%s, %s, %O)', interval, names, options);
			return this._createIntervalJobs(interval, names, data, options);
		}

		throw new Error('Unexpected error: Invalid job name(s)');
	}

	public async _createIntervalJob(interval: string | number, name: string, data: IJob['data'], options: RepeatOptions): Promise<Job> {
		const job = this.create(name, data);
		job.attrs.type = 'single';
		job.repeatEvery(interval, options);
		await job.save();

		return job;
	}

	private _createIntervalJobs(
		interval: string | number,
		names: string[],
		data: IJob['data'],
		options: RepeatOptions,
	): Promise<Job[]> | undefined {
		try {
			const jobs = names.map((name) => this._createIntervalJob(interval, name, data, options));
			debug('every() -> all jobs created successfully');

			return Promise.all(jobs);
		} catch (error) {
			debug('every() -> error creating one or more of the jobs', error);
		}
	}

	private async _createScheduledJob(when: string | Date, name: string, data: IJob['data']): Promise<Job> {
		const job = this.create(name, data);
		await job.schedule(when).save();
		return job;
	}

	private async _createScheduledJobs(when: string | Date, names: string[], data: IJob['data']): Promise<Job[]> {
		try {
			const jobs = await Promise.all(names.map((name) => this._createScheduledJob(when, name, data)));
			debug('Agenda.schedule()::createJobs() -> all jobs created successfully');
			return jobs;
		} catch (error) {
			debug('Agenda.schedule()::createJobs() -> error creating one or more of the jobs');
			throw error;
		}
	}

	public schedule(when: string | Date, name: string, data: IJob['data']): Promise<Job>;

	public schedule(when: string | Date, names: string[], data: IJob['data']): Promise<Job[]>;

	public schedule(when: string | Date, names: string | string[], data: IJob['data']): Promise<Job | Job[]> {
		if (typeof names === 'string') {
			debug('Agenda.schedule(%s, %O, [%O], cb)', when, names);
			return this._createScheduledJob(when, names, data);
		}

		if (Array.isArray(names)) {
			debug('Agenda.schedule(%s, %O, [%O])', when, names);
			return this._createScheduledJobs(when, names, data);
		}

		throw new Error('Unexpected error: invalid job name(s)');
	}

	public async now(name: string, data: IJob['data'], ...args: Array<any>): Promise<Job> {
		debug('Agenda.now(%s, [Object])', name);
		try {
			noCallback([name, data, ...args], 2);
			const job = this.create(name, data);

			job.schedule(new Date());
			await job.save();

			return job;
		} catch (error) {
			debug('error trying to create a job for this exact moment');
			throw error;
		}
	}

	public async cancel(query: Record<string, any>): Promise<number> {
		debug('attempting to cancel all Agenda jobs', query);
		try {
			const { deletedCount } = await this._collection.deleteMany(query);
			debug('%s jobs cancelled', deletedCount || 0);
			return deletedCount || 0;
		} catch (error) {
			debug('error trying to delete jobs from MongoDB');
			throw error;
		}
	}

	private async _processDbResult(job: Job, result: ModifyResult | InsertOneResult): Promise<void> {
		debug('processDbResult() called with success, checking whether to process job immediately or not');

		// We have a result from the above calls
		// findOneAndUpdate() returns different results than insertOne() so check for that
		const res = await (async (): Promise<Document | null> => {
			if ('value' in result) {
				return result.value;
			}

			if ('insertedId' in result) {
				return this._collection.findOne({ _id: result.insertedId });
			}

			return null;
		})();

		if (!res) {
			debug('job not found');
			return;
		}

		job.attrs._id = res._id;
		job.attrs.nextRunAt = res.nextRunAt;

		// If the current job would have been processed in an older scan, process the job immediately
		if (job.attrs.nextRunAt && job.attrs.nextRunAt < (this._nextScanAt as Date)) {
			debug('[%s:%s] job would have ran by nextScanAt, processing the job immediately', job.attrs.name, res._id);
			this.processJobs(job);
		}
	}

	private async _updateJob(job: Job, props: Record<string, any>): Promise<void> {
		const id = job.attrs._id;
		const update = {
			$set: props,
		};

		// Update the job and process the resulting data'
		debug('job already has _id, calling findOneAndUpdate() using _id as query');
		const result = await this._collection.findOneAndUpdate({ _id: id }, update, { returnDocument: 'after' });

		return this._processDbResult(job, result);
	}

	private async _saveSingleJob(job: Job, props: Record<string, any>, now: Date): Promise<void> {
		// Job type set to 'single' so...
		debug('job with type of "single" found');

		const { nextRunAt, ...$set } = props;
		const $setOnInsert: Record<string, any> = {};

		if (nextRunAt && nextRunAt <= now) {
			debug('job has a scheduled nextRunAt time, protecting that field from upsert');
			$setOnInsert.nextRunAt = nextRunAt;
		} else {
			$set.nextRunAt = nextRunAt;
		}

		const update = {
			$set,
			$setOnInsert,
		};

		// Try an upsert
		debug('calling findOneAndUpdate() with job name and type of "single" as query');
		const result = await this._collection.findOneAndUpdate(
			{
				name: props.name,
				type: 'single',
			},
			update,
			{
				upsert: true,
				returnDocument: 'after',
			},
		);

		return this._processDbResult(job, result);
	}

	private async _saveUniqueJob(job: Job, props: Record<string, any>): Promise<void> {
		// If we want the job to be unique, then we can upsert based on the 'unique' query object that was passed in
		const { unique: query, uniqueOpts } = job.attrs;
		if (!query) {
			throw new Error('Unexpected Error: No unique data to store on the job');
		}

		query.name = props.name;
		const update = uniqueOpts?.insertOnly ? { $setOnInsert: props } : { $set: props };

		// Use the 'unique' query object to find an existing job or create a new one
		debug('calling findOneAndUpdate() with unique object as query: \n%O', query);
		const result = await this._collection.findOneAndUpdate(query, update, { upsert: true, returnDocument: 'after' });
		return this._processDbResult(job, result);
	}

	private async _saveNewJob(job: Job, props: Record<string, any>): Promise<void> {
		// If all else fails, the job does not exist yet so we just insert it into MongoDB
		debug('using default behavior, inserting new job via insertOne() with props that were set: \n%O', props);
		const result = await this._collection.insertOne(props);
		return this._processDbResult(job, result);
	}

	public async saveJob(job: Job): Promise<void> {
		try {
			debug('attempting to save a job into Agenda instance');

			// Grab information needed to save job but that we don't want to persist in MongoDB
			const id = job.attrs._id;

			const props = job.toJSON();
			// delete props._id;
			// delete props.unique;
			// delete props.uniqueOpts;

			// Store name of agenda queue as last modifier in job data
			props.lastModifiedBy = this._name;
			debug('[job %s] set job props: \n%O', id, props);

			// Grab current time and set default query options for MongoDB
			const now = new Date();
			debug('current time stored as %s', now.toISOString());

			// If the job already had an ID, then update the properties of the job
			// i.e, who last modified it, etc
			if (id) {
				return this._updateJob(job, props);
			}

			if (props.type === 'single') {
				return this._saveSingleJob(job, props, now);
			}

			if (job.attrs.unique) {
				return this._saveUniqueJob(job, props);
			}

			return this._saveNewJob(job, props);
		} catch (error) {
			debug('processDbResult() received an error, job was not updated/created');
			throw error;
		}
	}

	public async start(): Promise<void> {
		if (this._processInterval) {
			debug('Agenda.start was already called, ignoring');
			return this._ready;
		}

		await this._ready;
		debug('Agenda.start called, creating interval to call processJobs every [%dms]', this._processEvery);
		this._processInterval = setInterval(() => this.processJobs(), this._processEvery || defaultInterval);
		process.nextTick(() => this.processJobs());
	}

	private _unlockJobs(): Promise<void> {
		return new Promise((resolve, reject) => {
			debug('Agenda._unlockJobs()');
			const jobIds = this._lockedJobs.map((job) => job.attrs._id);

			if (jobIds.length === 0) {
				debug('no jobs to unlock');
				return resolve();
			}

			debug('about to unlock jobs with ids: %O', jobIds);
			this._collection.updateMany({ _id: { $in: jobIds } }, { $set: { lockedAt: null } }, (err) => {
				if (err) {
					return reject(err);
				}

				this._lockedJobs = [];
				return resolve();
			});
		});
	}

	public stop(): Promise<void> {
		debug('Agenda.stop called, clearing interval for processJobs()');
		clearInterval(this._processInterval as NodeJS.Timeout);
		this._processInterval = undefined;

		return this._unlockJobs();
	}

	public getDefinition(jobName: string): JobDefinition {
		return this._definitions[jobName];
	}

	private async _findAndLockNextJob(jobName: string, definition: JobDefinition): Promise<Job | undefined> {
		const now = new Date();
		const lockDeadline = new Date(Date.now().valueOf() - definition.lockLifetime);
		debug('_findAndLockNextJob(%s, [Function])', jobName);

		// Don't try and access MongoDB if we've lost connection to it.
		// @ts-ignore
		const s = this._mdb.s.client || this._mdb.db.s.client;
		if (s.topology.connections && s.topology.connections().length === 0 && !this._mongoUseUnifiedTopology) {
			if (s.topology.autoReconnect && !s.topology.isDestroyed()) {
				// Continue processing but notify that Agenda has lost the connection
				debug('Missing MongoDB connection, not attempting to find and lock a job');
				this.emit('error', new Error('Lost MongoDB connection'));
			} else {
				// No longer recoverable
				debug('topology.autoReconnect: %s, topology.isDestroyed(): %s', s.topology.autoReconnect, s.topology.isDestroyed());
				throw new Error('MongoDB connection is not recoverable, application restart required');
			}
		} else {
			// /**
			// * Query used to find job to run
			// * @type {{$and: [*]}}
			// */
			const JOB_PROCESS_WHERE_QUERY = {
				$and: [
					{
						name: jobName,
						disabled: { $ne: true },
					},
					{
						$or: [
							{
								lockedAt: { $eq: null },
								nextRunAt: { $lte: this._nextScanAt },
							},
							{
								lockedAt: { $lte: lockDeadline },
							},
						],
					},
				],
			};

			const JOB_PROCESS_SET_QUERY = { $set: { lockedAt: now } };

			// Find ONE and ONLY ONE job and set the 'lockedAt' time so that job begins to be processed
			const result = await this._collection.findOneAndUpdate(JOB_PROCESS_WHERE_QUERY, JOB_PROCESS_SET_QUERY, {
				returnDocument: 'after',
				sort: this._sort,
			});

			let job;
			if (result.value) {
				debug('found a job available to lock, creating a new job on Agenda with id [%s]', result.value._id);
				job = createJob(this, result.value as unknown as IJob);
			}

			return job;
		}
	}

	/**
	 * Returns true if a job of the specified name can be locked.
	 * Considers maximum locked jobs at any time if self._lockLimit is > 0
	 * Considers maximum locked jobs of the specified name at any time if jobDefinition.lockLimit is > 0
	 */
	private _shouldLock(name: string): boolean {
		const jobDefinition = this.getDefinition(name);
		let shouldLock = true;
		if (this._lockLimit && this._lockLimit <= this._lockedJobs.length) {
			shouldLock = false;
		}

		if (jobDefinition.lockLimit && jobDefinition.lockLimit <= jobDefinition.locked) {
			shouldLock = false;
		}

		debug('job [%s] lock status: shouldLock = %s', name, shouldLock);
		return shouldLock;
	}

	private _enqueueJobs(job: Job | Job[]): void {
		const jobs = Array.isArray(job) ? job : [job];

		jobs.forEach((job) => this._jobQueue.insert(job));
	}

	/**
	 * Internal method that will lock a job and store it on MongoDB
	 * This method is called when we immediately start to process a job without using the process interval
	 * We do this because sometimes jobs are scheduled but will be run before the next process time
	 */
	private async _lockOnTheFly(): Promise<void> {
		// Already running this? Return
		if (this._isLockingOnTheFly) {
			debug('lockOnTheFly() already running, returning');
			return;
		}

		// Don't have any jobs to run? Return
		if (this._jobsToLock.length === 0) {
			debug('no jobs to current lock on the fly, returning');
			this._isLockingOnTheFly = false;
			return;
		}

		// Set that we are running this
		this._isLockingOnTheFly = true;

		// Grab a job that needs to be locked
		const now = new Date();
		const job = this._jobsToLock.pop();
		if (!job) {
			throw new Error('Unexpected Error: Job not found [lockOnTheFly]');
		}

		// If locking limits have been hit, stop locking on the fly.
		// Jobs that were waiting to be locked will be picked up during a
		// future locking interval.
		if (!this._shouldLock(job.attrs.name)) {
			debug('lock limit hit for: [%s]', job.attrs.name);
			this._jobsToLock = [];
			this._isLockingOnTheFly = false;
			return;
		}

		// Query to run against collection to see if we need to lock it
		const criteria = {
			_id: job.attrs._id,
			lockedAt: null,
			nextRunAt: job.attrs.nextRunAt,
			disabled: { $ne: true },
		};

		// Update / options for the MongoDB query
		const update = { $set: { lockedAt: now } };

		// Lock the job in MongoDB!
		const resp = await this._collection.findOneAndUpdate(criteria, update, { returnDocument: 'after' });

		if (resp.value) {
			const job = createJob(this, resp.value as unknown as IJob);
			debug('found job [%s] that can be locked on the fly', job.attrs.name);
			this._lockedJobs.push(job);
			this._definitions[job.attrs.name].locked++;
			this._enqueueJobs(job);
			this._jobProcessing();
		}

		// Mark lock on fly is done for now
		this._isLockingOnTheFly = false;

		// Re-run in case anything is in the queue
		await this._lockOnTheFly();
	}

	private async _jobQueueFilling(name: string): Promise<void> {
		// Don't lock because of a limit we have set (lockLimit, etc)
		if (!this._shouldLock(name)) {
			debug('lock limit reached in queue filling for [%s]', name);
			return;
		}

		// Set the date of the next time we are going to run _processEvery function
		this._nextScanAt = new Date(Date.now() + this._processEvery || defaultInterval);

		// For this job name, find the next job to run and lock it!
		try {
			const job = await this._findAndLockNextJob(name, this._definitions[name]);
			// Still have the job?
			// 1. Add it to lock list
			// 2. Add count of locked jobs
			// 3. Queue the job to actually be run now that it is locked
			// 4. Recursively run this same method we are in to check for more available jobs of same type!
			if (job) {
				debug('[%s:%s] job locked while filling queue', name, job.attrs._id);
				this._lockedJobs.push(job);
				this._definitions[job.attrs.name].locked++;
				this._enqueueJobs(job);
				await this._jobQueueFilling(name);
				this._jobProcessing();
			}
		} catch (error) {
			debug('[%s] job lock failed while filling queue', name, error);
		}
	}

	private async _runOrRetry(): Promise<void> {
		if (!this._processInterval) {
			return;
		}

		const job = this._jobQueue.pop();
		if (!job) {
			return;
		}

		const jobDefinition = this._definitions[job.attrs.name];
		if (jobDefinition.concurrency > jobDefinition.running && this._runningJobs.length < this._maxConcurrency) {
			// Get the deadline of when the job is not supposed to go past for locking
			const lockDeadline = new Date(Date.now() - jobDefinition.lockLifetime);

			// This means a job has "expired", as in it has not been "touched" within the lockoutTime
			// Remove from local lock
			// NOTE: Shouldn't we update the 'lockedAt' value in MongoDB so it can be picked up on restart?
			if (job.attrs.lockedAt && job.attrs.lockedAt < lockDeadline) {
				debug('[%s:%s] job lock has expired, freeing it up', job.attrs.name, job.attrs._id);
				this._lockedJobs.splice(this._lockedJobs.indexOf(job), 1);
				jobDefinition.locked--;
				this._jobProcessing();
				return;
			}

			// Add to local "running" queue
			this._runningJobs.push(job);
			jobDefinition.running++;

			// CALL THE ACTUAL METHOD TO PROCESS THE JOB!!!
			debug('[%s:%s] processing job', job.attrs.name, job.attrs._id);

			job
				.run()
				.then((jobRan) => [null, jobRan])
				.catch((error) => [error, job])
				.then(([error, jobRan]) => this._processJobResult(error, jobRan));
		} else {
			// Run the job immediately by putting it on the top of the queue
			debug('[%s:%s] concurrency preventing immediate run, pushing job to top of queue', job.attrs.name, job.attrs._id);
			this._enqueueJobs(job);
		}
	}

	private _jobProcessing(): void {
		// Ensure we have jobs
		if (this._jobQueue.length === 0) {
			return;
		}

		// Store for all sorts of things
		const now = new Date();

		// Get the next job that is not blocked by concurrency
		const job = this._jobQueue.returnNextConcurrencyFreeJob(this._definitions);

		if (!job.attrs.nextRunAt) {
			return;
		}

		debug('[%s:%s] about to process job', job.attrs.name, job.attrs._id);

		// If the 'nextRunAt' time is older than the current time, run the job
		// Otherwise, setTimeout that gets called at the time of 'nextRunAt'
		if (job.attrs.nextRunAt <= now) {
			debug('[%s:%s] nextRunAt is in the past, run the job immediately', job.attrs.name, job.attrs._id);
			this._runOrRetry();
		} else {
			const runIn = job.attrs.nextRunAt.valueOf() - now.valueOf();
			debug('[%s:%s] nextRunAt is in the future, calling setTimeout(%d)', job.attrs.name, job.attrs._id, runIn);
			setTimeout(() => this._jobProcessing(), runIn);
		}
	}

	private _processJobResult(err: Error | null, job: Job): void {
		if (err) {
			job.agenda.emit('error', err);
			return;
		}

		const { name } = job.attrs;

		// Job isn't in running jobs so throw an error
		if (!this._runningJobs.includes(job)) {
			debug('[%s] callback was called, job must have been marked as complete already', job.attrs._id);
			throw new Error(`callback already called - job ${name} already marked complete`);
		}

		// Remove the job from the running queue
		this._runningJobs.splice(this._runningJobs.indexOf(job), 1);
		if (this._definitions[name].running > 0) {
			this._definitions[name].running--;
		}

		// Remove the job from the locked queue
		this._lockedJobs.splice(this._lockedJobs.indexOf(job), 1);
		if (this._definitions[name].locked > 0) {
			this._definitions[name].locked--;
		}

		// Re-process jobs now that one has finished
		this._jobProcessing();
	}

	public processJobs(extraJob?: Job): void {
		debug('starting to process jobs');
		// Make sure an interval has actually been set
		// Prevents race condition with 'Agenda.stop' and already scheduled run
		if (!this._processInterval) {
			debug('no _processInterval set when calling processJobs, returning');
			return;
		}

		let jobName;

		// Determine whether or not we have a direct process call!
		if (!extraJob) {
			// Go through each jobName set in 'Agenda.process' and fill the queue with the next jobs
			for (jobName in this._definitions) {
				if (this._definitions.hasOwnProperty(jobName)) {
					debug('queuing up job to process: [%s]', jobName);
					this._jobQueueFilling(jobName);
				}
			}
		} else if (this._definitions[extraJob.attrs.name]) {
			// Add the job to list of jobs to lock and then lock it immediately!
			debug('job [%s] was passed directly to processJobs(), locking and running immediately', extraJob.attrs.name);
			this._jobsToLock.push(extraJob);
			this._lockOnTheFly();
		}
	}
}

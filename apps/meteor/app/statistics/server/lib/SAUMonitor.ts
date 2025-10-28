import type { ISession, ISessionDevice, ISocketConnectionLogged, IUser } from '@rocket.chat/core-typings';
import { cronJobs } from '@rocket.chat/cron';
import { Logger } from '@rocket.chat/logger';
import { Sessions, Users, aggregates } from '@rocket.chat/models';
import mem from 'mem';
import { Meteor } from 'meteor/meteor';
import UAParser from 'ua-parser-js';

import { UAParserMobile, UAParserDesktop } from './UAParserCustom';
import { getMostImportantRole } from '../../../../lib/roles/getMostImportantRole';
import { getClientAddress } from '../../../../server/lib/getClientAddress';
import { sauEvents } from '../../../../server/services/sauMonitor/events';

type DateObj = { day: number; month: number; year: number };

const getDateObj = (dateTime = new Date()): DateObj => ({
	day: dateTime.getDate(),
	month: dateTime.getMonth() + 1,
	year: dateTime.getFullYear(),
});

const logger = new Logger('SAUMonitor');

const getUserRoles = mem(
	async (userId: string): Promise<string[]> => {
		const user = await Users.findOneById<Pick<IUser, 'roles'>>(userId, { projection: { roles: 1 } });

		return user?.roles || [];
	},
	{ maxAge: 5000 },
);

const isProdEnv = process.env.NODE_ENV === 'production';

/**
 * Server Session Monitor for SAU(Simultaneously Active Users) based on Meteor server sessions
 */
export class SAUMonitorClass {
	private _started: boolean;

	private _dailyComputeJobName: string;

	private _dailyFinishSessionsJobName: string;

	private scheduler = cronJobs;

	constructor() {
		this._started = false;
		this._dailyComputeJobName = 'aggregate-sessions';
		this._dailyFinishSessionsJobName = 'finish-sessions';
	}

	async start(): Promise<void> {
		if (this.isRunning()) {
			return;
		}

		await this._startMonitoring();

		this._started = true;
		logger.debug('[start]');
	}

	async stop(): Promise<void> {
		if (!this.isRunning()) {
			return;
		}

		this._started = false;

		if (await this.scheduler.has(this._dailyComputeJobName)) {
			await this.scheduler.remove(this._dailyComputeJobName);
		}
		if (await this.scheduler.has(this._dailyFinishSessionsJobName)) {
			await this.scheduler.remove(this._dailyFinishSessionsJobName);
		}

		logger.debug('[stop]');
	}

	isRunning(): boolean {
		return this._started === true;
	}

	async _startMonitoring(): Promise<void> {
		try {
			this._handleAccountEvents();
			this._handleOnConnection();
			await this._startCronjobs();
		} catch (err: any) {
			throw new Meteor.Error(err);
		}
	}

	private _handleOnConnection(): void {
		if (this.isRunning()) {
			return;
		}

		sauEvents.on('socket.disconnected', async ({ id, instanceId }) => {
			if (!this.isRunning()) {
				return;
			}

			await Sessions.closeByInstanceIdAndSessionId(instanceId, id);
		});
	}

	private _handleAccountEvents(): void {
		if (this.isRunning()) {
			return;
		}

		sauEvents.on('accounts.login', async ({ userId, connection }) => {
			if (!this.isRunning()) {
				return;
			}

			const roles = await getUserRoles(userId);

			const mostImportantRole = getMostImportantRole(roles);

			const loginAt = new Date();
			const params = { userId, roles, mostImportantRole, loginAt, ...getDateObj() };
			await this._handleSession(connection, params);
		});

		sauEvents.on('accounts.logout', async ({ userId, connection }) => {
			if (!this.isRunning()) {
				return;
			}

			if (!userId) {
				logger.warn(`Received 'accounts.logout' event without 'userId'`);
				return;
			}

			const { id: sessionId } = connection;
			if (!sessionId) {
				logger.warn(`Received 'accounts.logout' event without 'sessionId'`);
				return;
			}

			const session = await Sessions.getLoggedInByUserIdAndSessionId<Pick<ISession, 'loginToken'>>(userId, sessionId, {
				projection: { loginToken: 1 },
			});
			if (!session?.loginToken) {
				if (!isProdEnv) {
					throw new Error('Session not found during logout');
				}
				logger.error('Session not found during logout', { userId, sessionId });
				return;
			}

			await Sessions.logoutBySessionIdAndUserId({ loginToken: session.loginToken, userId });
		});
	}

	private async _handleSession(
		connection: ISocketConnectionLogged,
		params: Pick<ISession, 'userId' | 'mostImportantRole' | 'loginAt' | 'day' | 'month' | 'year' | 'roles'>,
	): Promise<void> {
		const data = this._getConnectionInfo(connection, params);

		if (!data) {
			return;
		}

		const searchTerm = this._getSearchTerm(data);

		await Sessions.createOrUpdate({ ...data, searchTerm });
	}

	private async _finishSessionsFromDate(yesterday: Date, today: Date): Promise<void> {
		if (!this.isRunning()) {
			return;
		}

		const { day, month, year } = getDateObj(yesterday);
		const beforeDateTime = new Date(year, month - 1, day, 23, 59, 59, 999);

		const currentDate = getDateObj(today);
		const nextDateTime = new Date(currentDate.year, currentDate.month - 1, currentDate.day);

		const cursor = Sessions.findSessionsNotClosedByDateWithoutLastActivity({ year, month, day });

		const batch = [];

		for await (const session of cursor) {
			// create a new session for the current day
			batch.push({
				...session,
				...currentDate,
				createdAt: nextDateTime,
			});

			if (batch.length === 500) {
				await Sessions.createBatch(batch);
				batch.length = 0;
			}
		}

		if (batch.length > 0) {
			await Sessions.createBatch(batch);
		}

		// close all sessions from current 'date'
		await Sessions.updateActiveSessionsByDate(
			{ year, month, day },
			{
				lastActivityAt: beforeDateTime,
			},
		);

		// TODO missing an action to perform on dangling sessions (for example remove sessions not closed one month ago)
	}

	private _getSearchTerm(session: Omit<ISession, '_id' | '_updatedAt' | 'createdAt' | 'searchTerm'>): string {
		return [session.device?.name, session.device?.type, session.device?.os.name, session.sessionId, session.userId]
			.filter(Boolean)
			.join('');
	}

	private _getConnectionInfo(
		connection: ISocketConnectionLogged,
		params: Pick<ISession, 'userId' | 'mostImportantRole' | 'loginAt' | 'day' | 'month' | 'year' | 'roles'>,
	): Omit<ISession, '_id' | '_updatedAt' | 'createdAt' | 'searchTerm'> | undefined {
		if (!connection) {
			return;
		}

		const ip = getClientAddress(connection);

		const host = connection.httpHeaders?.host ?? '';

		return {
			type: 'session',
			sessionId: connection.id,
			instanceId: connection.instanceId,
			...(connection.loginToken && { loginToken: connection.loginToken }),
			ip,
			host,
			...this._getUserAgentInfo(connection),
			...params,
		};
	}

	private _getUserAgentInfo(connection: ISocketConnectionLogged): { device: ISessionDevice } | undefined {
		if (!connection?.httpHeaders?.['user-agent']) {
			return;
		}

		const uaString = connection.httpHeaders['user-agent'];

		// TODO define a type for "result" below
		// | UAParser.IResult
		// | { device: { type: string; model?: string }; browser: undefined; os: undefined; app: { name: string; version: string } }
		// | {
		// 		device: { type: string; model?: string };
		// 		browser: undefined;
		// 		os: string;
		// 		app: { name: string; version: string };
		//   }

		const result = ((): any => {
			if (UAParserMobile.isMobileApp(uaString)) {
				return UAParserMobile.uaObject(uaString);
			}

			if (UAParserDesktop.isDesktopApp(uaString)) {
				return UAParserDesktop.uaObject(uaString);
			}

			const ua = new UAParser(uaString);
			return ua.getResult();
		})();

		const info: ISessionDevice = {
			type: 'other',
			name: '',
			longVersion: '',
			os: {
				name: '',
				version: '',
			},
			version: '',
		};

		const removeEmptyProps = (obj: any): any => {
			Object.keys(obj).forEach((p) => (!obj[p] || obj[p] === undefined) && delete obj[p]);
			return obj;
		};

		if (result.browser?.name) {
			info.type = 'browser';
			info.name = result.browser.name;
			info.longVersion = result.browser.version || '';
		}

		if (typeof result.os !== 'string' && result.os?.name) {
			info.os = removeEmptyProps(result.os) || '';
		}

		if (result.device && (result.device.type || result.device.model)) {
			info.type = result.device.type || '';

			if (result.hasOwnProperty('app') && result.app?.name) {
				info.name = result.app.name;
				info.longVersion = result.app.version;
				if (result.app.bundle) {
					info.longVersion += ` ${result.app.bundle}`;
				}
			}
		}

		if (typeof info.longVersion === 'string') {
			info.version = info.longVersion.match(/(\d+\.){0,2}\d+/)?.[0] || '';
		}

		return {
			device: info,
		};
	}

	private async _startCronjobs(): Promise<void> {
		logger.info('[aggregate] - Start Cron.');
		const dailyComputeProcessTime = '0 2 * * *';
		const dailyFinishSessionProcessTime = '5 1 * * *';
		await this.scheduler.add(this._dailyComputeJobName, dailyComputeProcessTime, async () => this._aggregate());
		await this.scheduler.add(this._dailyFinishSessionsJobName, dailyFinishSessionProcessTime, async () => {
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);

			await this._finishSessionsFromDate(yesterday, new Date());
		});
	}

	private async _aggregate(): Promise<void> {
		if (!this.isRunning()) {
			return;
		}

		const today = new Date();

		// get sessions from 3 days ago to make sure even if a few cron jobs were skipped, we still have the data
		const threeDaysAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3, 0, 0, 0, 0);

		const period = { start: getDateObj(threeDaysAgo), end: getDateObj(today) };

		logger.info({ msg: '[aggregate] - Aggregating data.', period });

		for await (const record of aggregates.dailySessions(Sessions.col, period)) {
			await Sessions.updateDailySessionById(`${record.userId}-${record.year}-${record.month}-${record.day}`, record);
		}

		await Sessions.updateAllSessionsByDateToComputed(period);
	}
}

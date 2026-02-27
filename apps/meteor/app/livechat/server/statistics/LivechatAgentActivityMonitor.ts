import type { ILivechatAgent, ISocketConnection } from '@rocket.chat/core-typings';
import { cronJobs } from '@rocket.chat/cron';
import { LivechatAgentActivity, Sessions, Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';
import { format, differenceInSeconds } from 'date-fns';

import { callbacks } from '../../../../server/lib/callbacks';

const formatDate = (dateTime = new Date()): { date: number } => ({
	date: parseInt(format(dateTime, 'yyyyMMdd'), 10),
});

export class LivechatAgentActivityMonitor {
	private _started: boolean;

	private _name: string;

	private scheduler = cronJobs;

	constructor() {
		this._started = false;
		this._handleAgentStatusChanged = this._handleAgentStatusChanged.bind(this);
		this._handleUserStatusLivechatChanged = this._handleUserStatusLivechatChanged.bind(this);
		this._updateActiveSessions = this._updateActiveSessions.bind(this);
		this._name = 'Livechat Agent Activity Monitor';
	}

	async start(): Promise<void> {
		await this._setupListeners();
	}

	async stop(): Promise<void> {
		if (!this.isRunning()) {
			return;
		}

		await this.scheduler.remove(this._name);

		this._started = false;
	}

	isRunning(): boolean {
		return this._started;
	}

	async _setupListeners(): Promise<void> {
		if (this.isRunning()) {
			return;
		}
		await this._startMonitoring();

		// TODO use service event socket.connected instead
		Meteor.onConnection((connection: unknown) => this._handleMeteorConnection(connection as ISocketConnection));
		callbacks.add('livechat.agentStatusChanged', this._handleAgentStatusChanged);
		callbacks.add('livechat.setUserStatusLivechat', (...args) => {
			return this._handleUserStatusLivechatChanged(...args);
		});
		this._started = true;
	}

	async _startMonitoring(): Promise<void> {
		await this.scheduler.add(this._name, '0 0 * * *', () => this._updateActiveSessions());
	}

	async _updateActiveSessions(): Promise<void> {
		const openLivechatAgentSessions = LivechatAgentActivity.findOpenSessions();

		const now = new Date();
		const startedAt = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		for await (const session of openLivechatAgentSessions) {
			const startDate = new Date(session.lastStartedAt);
			const stoppedAt = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 23, 59, 59);
			const data = { ...formatDate(startDate), agentId: session.agentId };
			const availableTime = differenceInSeconds(stoppedAt, new Date(session.lastStartedAt));

			await Promise.all([
				LivechatAgentActivity.updateLastStoppedAt({ ...data, availableTime, lastStoppedAt: stoppedAt }),
				LivechatAgentActivity.updateServiceHistory({ ...data, serviceHistory: { startedAt: session.lastStartedAt, stoppedAt } }),
			]);
			await this._createOrUpdateSession(session.agentId, startedAt);
		}
	}

	async _handleMeteorConnection(connection: ISocketConnection): Promise<void> {
		if (!this.isRunning()) {
			return;
		}

		const session = await Sessions.findOneBySessionId(connection.id);
		if (!session) {
			return;
		}
		const user = await Users.findOneById<Pick<ILivechatAgent, '_id' | 'statusLivechat' | 'status'>>(session.userId, {
			projection: { _id: 1, status: 1, statusLivechat: 1 },
		});
		if (user && user.status !== 'offline' && user.statusLivechat === 'available') {
			await this._createOrUpdateSession(user._id);
		}
		connection.onClose(() => {
			if (session) {
				void this._updateSessionWhenAgentStop(session.userId);
			}
		});
	}

	async _handleAgentStatusChanged({ userId, status }: { userId: string; status: string }) {
		if (!this.isRunning()) {
			return;
		}

		const user = await Users.findOneById<Pick<ILivechatAgent, '_id' | 'statusLivechat'>>(userId, { projection: { statusLivechat: 1 } });
		if (!user || user.statusLivechat !== 'available') {
			return;
		}

		if (status !== 'offline') {
			await this._createOrUpdateSession(userId);
		} else {
			await this._updateSessionWhenAgentStop(userId);
		}
	}

	async _handleUserStatusLivechatChanged({ userId, status }: { userId: string; status: string }): Promise<void> {
		if (!this.isRunning()) {
			return;
		}

		const user = await Users.findOneById<Pick<ILivechatAgent, '_id' | 'status'>>(userId, { projection: { status: 1 } });
		if (user && user.status === 'offline') {
			return;
		}

		if (status === 'available') {
			await this._createOrUpdateSession(userId);
		}
		if (status === 'not-available') {
			await this._updateSessionWhenAgentStop(userId);
		}
	}

	async _createOrUpdateSession(userId: string, lastStartedAt?: Date): Promise<void> {
		const data = { ...formatDate(lastStartedAt), agentId: userId, lastStartedAt };
		await LivechatAgentActivity.createOrUpdate(data);
	}

	async _updateSessionWhenAgentStop(agentId: string): Promise<void> {
		const { date } = formatDate();

		const livechatSession = await LivechatAgentActivity.findOneByAgendIdAndDate(agentId, date);
		if (!livechatSession) {
			return;
		}

		const stoppedAt = new Date();
		const availableTime = differenceInSeconds(stoppedAt, new Date(livechatSession.lastStartedAt));

		await Promise.all([
			LivechatAgentActivity.updateLastStoppedAt({ agentId, date, availableTime, lastStoppedAt: stoppedAt }),
			LivechatAgentActivity.updateServiceHistory({
				agentId,
				date,
				serviceHistory: { startedAt: livechatSession.lastStartedAt, stoppedAt },
			}),
		]);
	}
}

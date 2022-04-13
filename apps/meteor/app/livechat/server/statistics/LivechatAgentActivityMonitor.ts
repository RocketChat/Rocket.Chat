import moment from 'moment';
import { ISocketConnection } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { SyncedCron } from 'meteor/littledata:synced-cron';

import { callbacks } from '../../../../lib/callbacks';
import { Users } from '../../../models/server';
import { LivechatAgentActivity, Sessions } from '../../../models/server/raw';

const formatDate = (dateTime = new Date()): { date: number } => ({
	date: parseInt(moment(dateTime).format('YYYYMMDD')),
});

export class LivechatAgentActivityMonitor {
	private _started: boolean;

	private _name: string;

	constructor() {
		this._started = false;
		this._handleAgentStatusChanged = this._handleAgentStatusChanged.bind(this);
		this._handleUserStatusLivechatChanged = this._handleUserStatusLivechatChanged.bind(this);
		this._name = 'Livechat Agent Activity Monitor';
	}

	start(): void {
		this._setupListeners();
	}

	stop(): void {
		if (!this.isRunning()) {
			return;
		}

		SyncedCron.remove(this._name);

		this._started = false;
	}

	isRunning(): boolean {
		return this._started;
	}

	_setupListeners(): void {
		if (this.isRunning()) {
			return;
		}
		this._startMonitoring();

		// TODO use service event socket.connected instead
		Meteor.onConnection((connection: unknown) => this._handleMeteorConnection(connection as ISocketConnection));
		callbacks.add('livechat.agentStatusChanged', this._handleAgentStatusChanged);
		callbacks.add('livechat.setUserStatusLivechat', this._handleUserStatusLivechatChanged);
		this._started = true;
	}

	_startMonitoring(): void {
		SyncedCron.add({
			name: this._name,
			schedule: (parser: any) => parser.cron('0 0 * * *'),
			job: () => {
				Promise.await(this._updateActiveSessions());
			},
		});
	}

	async _updateActiveSessions(): Promise<void> {
		const openLivechatAgentSessions = await LivechatAgentActivity.findOpenSessions();
		if (!(await openLivechatAgentSessions.count())) {
			return;
		}
		const today = moment(new Date());
		const startedAt = new Date(today.year(), today.month(), today.date());
		for await (const session of openLivechatAgentSessions) {
			const startDate = moment(session.lastStartedAt);
			const stoppedAt = new Date(startDate.year(), startDate.month(), startDate.date(), 23, 59, 59);
			const data = { ...formatDate(startDate.toDate()), agentId: session.agentId };
			const availableTime = moment(stoppedAt).diff(moment(new Date(session.lastStartedAt)), 'seconds');
			await LivechatAgentActivity.updateLastStoppedAt({
				...data,
				availableTime,
				lastStoppedAt: stoppedAt,
			});
			await LivechatAgentActivity.updateServiceHistory({
				...data,
				serviceHistory: { startedAt: session.lastStartedAt, stoppedAt },
			});
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
		const user = Users.findOneById(session.userId);
		if (user && user.status !== 'offline' && user.statusLivechat === 'available') {
			await this._createOrUpdateSession(user._id);
		}
		connection.onClose(() => {
			if (session) {
				this._updateSessionWhenAgentStop(session.userId);
			}
		});
	}

	_handleAgentStatusChanged({ userId, status }: { userId: string; status: string }): void {
		if (!this.isRunning()) {
			return;
		}

		const user = Users.findOneById(userId);
		if (!user || user.statusLivechat !== 'available') {
			return;
		}

		if (status !== 'offline') {
			this._createOrUpdateSession(userId);
		} else {
			this._updateSessionWhenAgentStop(userId);
		}
	}

	async _handleUserStatusLivechatChanged({ userId, status }: { userId: string; status: string }): Promise<void> {
		if (!this.isRunning()) {
			return;
		}

		const user = Users.findOneById(userId);
		if (user && user.status === 'offline') {
			return;
		}

		if (status === 'available') {
			await this._createOrUpdateSession(userId);
		}
		if (status === 'not-available') {
			this._updateSessionWhenAgentStop(userId);
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
		const availableTime = moment(stoppedAt).diff(moment(new Date(livechatSession.lastStartedAt)), 'seconds');

		await LivechatAgentActivity.updateLastStoppedAt({
			agentId,
			date,
			availableTime,
			lastStoppedAt: stoppedAt,
		});
		await LivechatAgentActivity.updateServiceHistory({
			agentId,
			date,
			serviceHistory: { startedAt: livechatSession.lastStartedAt, stoppedAt },
		});
	}
}

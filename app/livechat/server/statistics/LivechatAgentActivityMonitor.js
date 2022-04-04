import moment from 'moment';
import { Meteor } from 'meteor/meteor';
import { SyncedCron } from 'meteor/littledata:synced-cron';

import { callbacks } from '../../../../lib/callbacks';
import { LivechatAgentActivity, Users } from '../../../models/server';
import { Sessions } from '../../../models/server/raw';

const formatDate = (dateTime = new Date()) => ({
	date: parseInt(moment(dateTime).format('YYYYMMDD')),
});

export class LivechatAgentActivityMonitor {
	constructor() {
		this._started = false;
		this._handleAgentStatusChanged = this._handleAgentStatusChanged.bind(this);
		this._handleUserStatusLivechatChanged = this._handleUserStatusLivechatChanged.bind(this);
		this._name = 'Livechat Agent Activity Monitor';
	}

	start() {
		this._setupListeners();
	}

	stop() {
		if (!this.isRunning()) {
			return;
		}

		SyncedCron.remove(this._name);

		this._started = false;
	}

	isRunning() {
		return this._started;
	}

	_setupListeners() {
		if (this.isRunning()) {
			return;
		}
		this._startMonitoring();
		Meteor.onConnection((connection) => this._handleMeteorConnection(connection));
		callbacks.add('livechat.agentStatusChanged', this._handleAgentStatusChanged);
		callbacks.add('livechat.setUserStatusLivechat', this._handleUserStatusLivechatChanged);
		this._started = true;
	}

	_startMonitoring() {
		SyncedCron.add({
			name: this._name,
			schedule: (parser) => parser.cron('0 0 * * *'),
			job: () => {
				this._updateActiveSessions();
			},
		});
	}

	_updateActiveSessions() {
		const openLivechatAgentSessions = LivechatAgentActivity.findOpenSessions().fetch();
		if (!openLivechatAgentSessions.length) {
			return;
		}
		const today = moment(new Date());
		const startedAt = new Date(today.year(), today.month(), today.date());
		for (const session of openLivechatAgentSessions) {
			const startDate = moment(session.lastStartedAt);
			const stoppedAt = new Date(startDate.year(), startDate.month(), startDate.date(), 23, 59, 59);
			const data = { ...formatDate(startDate.toDate()), agentId: session.agentId };
			const availableTime = moment(stoppedAt).diff(moment(new Date(session.lastStartedAt)), 'seconds');
			LivechatAgentActivity.updateLastStoppedAt({
				...data,
				availableTime,
				lastStoppedAt: stoppedAt,
			});
			LivechatAgentActivity.updateServiceHistory({
				...data,
				serviceHistory: { startedAt: session.lastStartedAt, stoppedAt },
			});
			this._createOrUpdateSession(session.agentId, startedAt);
		}
	}

	async _handleMeteorConnection(connection) {
		if (!this.isRunning()) {
			return;
		}

		const session = await Sessions.findOne({ sessionId: connection.id });
		if (!session) {
			return;
		}
		const user = Users.findOneById(session.userId);
		if (user && user.status !== 'offline' && user.statusLivechat === 'available') {
			this._createOrUpdateSession(user._id);
		}
		connection.onClose(() => {
			if (session) {
				this._updateSessionWhenAgentStop(session.userId);
			}
		});
	}

	_handleAgentStatusChanged({ userId, status }) {
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

	_handleUserStatusLivechatChanged({ userId, status }) {
		if (!this.isRunning()) {
			return;
		}

		const user = Users.findOneById(userId);
		if (user && user.status === 'offline') {
			return;
		}

		if (status === 'available') {
			this._createOrUpdateSession(userId);
		}
		if (status === 'not-available') {
			this._updateSessionWhenAgentStop(userId);
		}
	}

	_createOrUpdateSession(userId, lastStartedAt) {
		const data = { ...formatDate(lastStartedAt), agentId: userId, lastStartedAt };
		LivechatAgentActivity.createOrUpdate(data);
	}

	_updateSessionWhenAgentStop(userId) {
		const data = { ...formatDate(), agentId: userId };
		const livechatSession = LivechatAgentActivity.findOne(data);
		if (livechatSession) {
			const stoppedAt = new Date();
			const availableTime = moment(stoppedAt).diff(moment(new Date(livechatSession.lastStartedAt)), 'seconds');
			LivechatAgentActivity.updateLastStoppedAt({
				...data,
				availableTime,
				lastStoppedAt: stoppedAt,
			});
			LivechatAgentActivity.updateServiceHistory({
				...data,
				serviceHistory: { startedAt: livechatSession.lastStartedAt, stoppedAt },
			});
		}
	}
}

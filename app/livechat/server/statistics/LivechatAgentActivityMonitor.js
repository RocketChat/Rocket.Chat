import moment from 'moment';
import { Meteor } from 'meteor/meteor';
import { SyncedCron } from 'meteor/littledata:synced-cron';

import { callbacks } from '../../../callbacks/server';
import { LivechatAgentActivity, Sessions, Users } from '../../../models/server';

const formatDate = (dateTime = new Date()) => ({
	date: parseInt(moment(dateTime).format('YYYYMMDD')),
});

export class LivechatAgentActivityMonitor {
	constructor() {
		this._started = false;
		this._handleMeteorConnection = this._handleMeteorConnection.bind(this);
		this._handleAgentStatusChanged = this._handleAgentStatusChanged.bind(this);
		this._handleUserStatusLivechatChanged = this._handleUserStatusLivechatChanged.bind(this);
	}

	start() {
		this._setupListeners();
	}

	isRunning() {
		return this._started;
	}

	_setupListeners() {
		if (this.isRunning()) {
			return;
		}
		this._startMonitoring();
		Meteor.onConnection(this._handleMeteorConnection);
		callbacks.add('livechat.agentStatusChanged', this._handleAgentStatusChanged);
		callbacks.add('livechat.setUserStatusLivechat', this._handleUserStatusLivechatChanged);
		this.started = true;
	}

	_startMonitoring() {
		SyncedCron.add({
			name: 'Livechat Agent Activity Monitor',
			schedule: (parser) => parser.cron('59 23 * * *'),
			job: () => {
				this._updateActiveSessions();
			},
		});
		SyncedCron.start();
	}

	_updateActiveSessions() {
		const openLivechatAgentSessions = LivechatAgentActivity.findOpenSessions().fetch();
		if (!openLivechatAgentSessions.length) {
			return;
		}
		const today = moment(new Date());
		const stoppedAt = new Date(today.year(), today.month(), today.date(), 23, 59, 59);
		const tomorrow = moment(stoppedAt).clone().add(1, 'seconds');
		const startedAt = new Date(tomorrow.year(), tomorrow.month(), tomorrow.date(), tomorrow.hour(), tomorrow.minute(), tomorrow.second());
		for (const session of openLivechatAgentSessions) {
			const data = { ...formatDate(), agentId: session.agentId };
			const availableTime = moment(stoppedAt).diff(moment(new Date(session.lastStartedAt)), 'seconds');
			LivechatAgentActivity.updateLastStoppedAt({ ...data, availableTime, lastStoppedAt: stoppedAt });
			LivechatAgentActivity.updateServiceHistory({ ...data, serviceHistory: { startedAt: session.lastStartedAt, stoppedAt } });
			this._createOrUpdateSession(session.agentId, startedAt);
		}
	}

	_handleMeteorConnection(connection) {
		const session = Sessions.findOne({ sessionId: connection.id });
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
		const data = { ...formatDate(), agentId: userId, lastStartedAt };
		LivechatAgentActivity.createOrUpdate(data);
	}

	_updateSessionWhenAgentStop(userId) {
		const data = { ...formatDate(), agentId: userId };
		const livechatSession = LivechatAgentActivity.findOne(data);
		if (livechatSession) {
			const stoppedAt = new Date();
			const availableTime = moment(stoppedAt).diff(moment(new Date(livechatSession.lastStartedAt)), 'seconds');
			LivechatAgentActivity.updateLastStoppedAt({ ...data, availableTime, lastStoppedAt: stoppedAt });
			LivechatAgentActivity.updateServiceHistory({ ...data, serviceHistory: { startedAt: livechatSession.lastStartedAt, stoppedAt } });
		}
	}
}

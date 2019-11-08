import moment from 'moment';
import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../callbacks/server';
import { LivechatAgentActivity, Sessions, Users } from '../../../models/server';

const formatDate = (dateTime = new Date()) => ({
	date: parseInt(moment(dateTime).format('YYYYMMDD')),
});

export class LivechatAgentActivityMonitor {
	constructor() {
		this.started = false;
		this._handleMeteorConnection = this._handleMeteorConnection.bind(this);
		this._handleAgentStatusChanged = this._handleAgentStatusChanged.bind(this);
		this._handleUserStatusLivechatChanged = this._handleUserStatusLivechatChanged.bind(this);
	}

	start() {
		this._setupListeners();
	}

	isRunning() {
		return this.started;
	}

	_setupListeners() {
		if (this.isRunning()) {
			return;
		}
		Meteor.onConnection(this._handleMeteorConnection);
		callbacks.add('livechat.agentStatusChanged', this._handleAgentStatusChanged);
		callbacks.add('livechat.setUserStatusLivechat', this._handleUserStatusLivechatChanged);
		this.started = true;
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

	_createOrUpdateSession(userId) {
		const data = { ...formatDate(), agentId: userId };
		LivechatAgentActivity.createOrUpdate(data);
	}

	_updateSessionWhenAgentStop(userId) {
		const data = { ...formatDate(), agentId: userId };
		const livechatSession = LivechatAgentActivity.findOne(data);
		if (livechatSession) {
			const stoppedAt = new Date();
			const availableTime = moment(stoppedAt).diff(moment(new Date(livechatSession.lastStartedAt)), 'seconds');
			LivechatAgentActivity.updateLastStoppedAt({ ...data, availableTime, lastStopedAt: stoppedAt });
			LivechatAgentActivity.updateServiceHistory({ ...data, serviceHistory: { startedAt: livechatSession.lastStartedAt, stopedAt: stoppedAt } });
		}
	}
}
